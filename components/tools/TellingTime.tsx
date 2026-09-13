"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

type Mode = "practice" | "timed" | "streak";
type Phase = "setup" | "playing" | "results";
type Difficulty = "hours" | "half" | "quarter" | "five" | "minute";
type ClockTime = { hour: number; minute: number };
type TimeRecord = ClockTime & { ms: number; correct: boolean };

const TIMED_SECONDS = 60;
const SLOW_MS = 4000;
const TOOL_SLUG = "telling-time";

const DIFFICULTIES: {
  id: Difficulty;
  title: string;
  detail: string;
}[] = [
  { id: "hours", title: "Easy", detail: "Whole hours — 3:00, 11:00." },
  { id: "half", title: "Medium", detail: "Half hours — 3:00 or 3:30." },
  { id: "quarter", title: "Quarter hours", detail: ":00, :15, :30, and :45." },
  { id: "five", title: "Hard", detail: "Nearest 5 minutes." },
  { id: "minute", title: "Challenge", detail: "To the minute." },
];

function minutesFor(difficulty: Difficulty): number[] {
  if (difficulty === "hours") return [0];
  if (difficulty === "half") return [0, 30];
  if (difficulty === "quarter") return [0, 15, 30, 45];
  if (difficulty === "five") {
    return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  }
  return Array.from({ length: 60 }, (_, minute) => minute);
}

function sameTime(left: ClockTime, right: ClockTime) {
  return (
    ((left.hour % 12) || 12) === ((right.hour % 12) || 12) &&
    left.minute === right.minute
  );
}

function timeKey(time: ClockTime) {
  return formatTime(time);
}

function formatTime(time: ClockTime) {
  const hour = ((time.hour % 12) || 12);
  return `${hour}:${String(time.minute).padStart(2, "0")}`;
}

function nextHour(hour: number) {
  const normalized = (hour % 12) || 12;
  return normalized === 12 ? 1 : normalized + 1;
}

function minuteNumeral(minute: number) {
  const rounded = Math.round(minute / 5) * 5;
  const numeral = (rounded / 5) % 12;
  return numeral === 0 ? 12 : numeral;
}

function clockDescription(time: ClockTime) {
  const hour = (time.hour % 12) || 12;
  if (time.minute === 0) {
    return `Analog clock. The short hour hand points at ${hour}. The long minute hand points at 12.`;
  }
  return `Analog clock. The short hour hand is between ${hour} and ${nextHour(hour)}. The long minute hand points near ${minuteNumeral(time.minute)}.`;
}

function pickFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function nextTime(
  difficulty: Difficulty,
  last: ClockTime | null,
  focus?: ClockTime[],
): ClockTime {
  const pool =
    focus && focus.length > 0
      ? focus
      : minutesFor(difficulty).flatMap((minute) =>
          Array.from({ length: 12 }, (_, index) => ({
            hour: index + 1,
            minute,
          })),
        );

  if (pool.length === 0) {
    return { hour: 3, minute: 0 };
  }

  let pick = pickFrom(pool);
  for (let i = 0; i < 8 && last && pool.length > 1; i += 1) {
    if (!sameTime(pick, last)) break;
    pick = pickFrom(pool);
  }
  return pick;
}

function uniqueTimes(times: ClockTime[]) {
  const seen = new Set<string>();
  return times.filter((time) => {
    const key = timeKey(time);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseClockTime(raw: string): ClockTime | null {
  const trimmed = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/[.\-]/g, ":");
  const colonMatch = cleaned.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (colonMatch) {
    const parsed = normalizeTime(Number(colonMatch[1]), colonMatch[2] === undefined ? 0 : Number(colonMatch[2]));
    if (parsed) return parsed;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 3 || digits.length === 4) {
    return normalizeTime(Number(digits.slice(0, -2)), Number(digits.slice(-2)));
  }

  return null;
}

function normalizeTime(hour: number, minute: number): ClockTime | null {
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (minute < 0 || minute > 59) return null;
  if (hour === 0) return { hour: 12, minute };
  if (hour >= 1 && hour <= 12) return { hour, minute };
  return null;
}

export function TellingTime() {
  const [difficulty, setDifficulty] = useState<Difficulty>("hours");
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [clock, setClock] = useState<ClockTime>({ hour: 3, minute: 0 });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMED_SECONDS);
  const [focusTimes, setFocusTimes] = useState<ClockTime[] | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement>(null);
  const shownAtRef = useRef(0);
  const sessionStartRef = useRef(0);
  const phaseRef = useRef(phase);
  const endingRef = useRef(false);
  const busyRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const recordsRef = useRef(records);
  recordsRef.current = records;

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const expected = formatTime(clock);

  const stats = useMemo(() => {
    const attempted = records.length;
    const correct = records.filter((item) => item.correct).length;
    const missed = uniqueTimes(records.filter((item) => !item.correct));
    const slow = uniqueTimes(
      records.filter((item) => item.correct && item.ms >= SLOW_MS),
    );
    const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
    return { attempted, correct, missed, slow, accuracy };
  }, [records]);

  const focusInput = () => {
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const startSession = useCallback(
    (retry?: ClockTime[]) => {
      trackEvent(analyticsEvents.practiceStart, {
        tool: TOOL_SLUG,
        mode,
      });
      const first = nextTime(difficulty, null, retry);
      setFocusTimes(retry);
      setClock(first);
      setInput("");
      setFeedback(null);
      setRecords([]);
      recordsRef.current = [];
      setStreak(0);
      setBestStreak(0);
      setTimeLeft(TIMED_SECONDS);
      setPhase("playing");
      endingRef.current = false;
      busyRef.current = false;
      clearAdvanceTimer();
      shownAtRef.current = Date.now();
      sessionStartRef.current = Date.now();
    },
    [difficulty, mode],
  );

  const finishSession = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    const current = recordsRef.current;
    trackEvent(analyticsEvents.practiceFinish, {
      tool: TOOL_SLUG,
      mode,
      score: current.filter((item) => item.correct).length,
      count: current.length,
    });
    setPhase("results");
    setFeedback(null);
  }, [mode]);

  const submitAnswer = useCallback(
    (raw: string) => {
      if (phaseRef.current !== "playing" || busyRef.current) return;
      const value = raw.trim();
      if (value.length === 0) return;

      busyRef.current = true;
      const parsed = parseClockTime(value);
      const correct = parsed !== null && sameTime(parsed, clock);
      const ms = Date.now() - shownAtRef.current;
      const record: TimeRecord = { ...clock, ms, correct };

      setRecords((prev) => {
        const next = [...prev, record];
        recordsRef.current = next;
        return next;
      });
      setFeedback(correct ? "correct" : "wrong");

      if (correct) {
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((best) => Math.max(best, next));
          return next;
        });
      } else {
        setStreak(0);
      }

      const delay = correct ? 1400 : 2200;

      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => {
        if (!correct && mode === "streak") {
          busyRef.current = false;
          finishSession();
          return;
        }
        if (phaseRef.current !== "playing") {
          busyRef.current = false;
          return;
        }
        const upcoming = nextTime(difficulty, clock, focusTimes);
        setClock(upcoming);
        setInput("");
        setFeedback(null);
        shownAtRef.current = Date.now();
        busyRef.current = false;
        focusInput();
      }, delay);
    },
    [clock, difficulty, finishSession, focusTimes, mode],
  );

  useEffect(() => () => clearAdvanceTimer(), []);

  useEffect(() => {
    if (phase !== "playing" || mode !== "timed") return;

    const tick = () => {
      const remaining = Math.max(
        0,
        TIMED_SECONDS - (Date.now() - sessionStartRef.current) / 1000,
      );
      setTimeLeft(remaining);
      if (remaining <= 0) finishSession();
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [finishSession, mode, phase]);

  useEffect(() => {
    if (phase !== "playing" || feedback) return;
    focusInput();
  }, [clock, feedback, phase]);

  const padPress = (value: string) => {
    if (phase !== "playing" || feedback) return;
    if (value === "back") {
      setInput((prev) => prev.slice(0, -1));
      focusInput();
      return;
    }
    if (value === "go") {
      submitAnswer(input);
      return;
    }
    setInput((prev) => (prev.length >= 5 ? prev : `${prev}${value}`));
    focusInput();
  };

  const retryTimes = uniqueTimes([...stats.missed, ...stats.slow]);

  return (
    <div className="no-print rounded-2xl border border-line bg-surface p-4 snap-shadow sm:p-6">
      {phase === "setup" ? (
        <SetupPanel
          difficulty={difficulty}
          mode={mode}
          onDifficulty={setDifficulty}
          onMode={setMode}
          onStart={() => startSession()}
        />
      ) : null}

      {phase === "playing" ? (
        <PlayPanel
          mode={mode}
          clock={clock}
          expected={expected}
          input={input}
          inputRef={inputRef}
          feedback={feedback}
          streak={streak}
          stats={stats}
          timeLeft={timeLeft}
          onInput={setInput}
          onSubmit={() => submitAnswer(input)}
          onPad={padPress}
          onFinish={finishSession}
        />
      ) : null}

      {phase === "results" ? (
        <ResultsPanel
          mode={mode}
          stats={stats}
          bestStreak={bestStreak}
          onAgain={() => startSession(focusTimes)}
          onRetryMissed={
            retryTimes.length > 0 ? () => startSession(retryTimes) : undefined
          }
          onSetup={() => {
            setPhase("setup");
            setFocusTimes(undefined);
          }}
        />
      ) : null}
    </div>
  );
}

function SetupPanel({
  difficulty,
  mode,
  onDifficulty,
  onMode,
  onStart,
}: {
  difficulty: Difficulty;
  mode: Mode;
  onDifficulty: (difficulty: Difficulty) => void;
  onMode: (mode: Mode) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose precision</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Start with whole hours. Add half hours, quarters, five-minute marks, then
        every minute when you are ready.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {DIFFICULTIES.map((item) => (
          <ModeButton
            key={item.id}
            title={item.title}
            detail={item.detail}
            active={difficulty === item.id}
            onClick={() => onDifficulty(item.id)}
          />
        ))}
      </div>

      <h3 className="mt-6 font-display text-xl text-ink">Mode</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ModeButton
          title="Practice"
          detail="Untimed. Stop whenever you like."
          active={mode === "practice"}
          onClick={() => onMode("practice")}
        />
        <ModeButton
          title="Timed quiz"
          detail="60 seconds. How many can you get?"
          active={mode === "timed"}
          onClick={() => onMode("timed")}
        />
        <ModeButton
          title="Streak mode"
          detail="Keep going until the first miss."
          active={mode === "streak"}
          onClick={() => onMode("streak")}
        />
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink sm:w-auto"
      >
        Start
      </button>
    </div>
  );
}

function PlayPanel({
  mode,
  clock,
  expected,
  input,
  inputRef,
  feedback,
  streak,
  stats,
  timeLeft,
  onInput,
  onSubmit,
  onPad,
  onFinish,
}: {
  mode: Mode;
  clock: ClockTime;
  expected: string;
  input: string;
  inputRef: RefObject<HTMLInputElement | null>;
  feedback: "correct" | "wrong" | null;
  streak: number;
  stats: { attempted: number; correct: number; accuracy: number };
  timeLeft: number;
  onInput: (value: string) => void;
  onSubmit: () => void;
  onPad: (value: string) => void;
  onFinish: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Score" value={`${stats.correct}`} />
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Streak" value={`${streak}`} />
        <Stat
          label={mode === "timed" ? "Time" : "Tried"}
          value={mode === "timed" ? `${Math.ceil(timeLeft)}s` : `${stats.attempted}`}
        />
      </div>

      <p
        className={`mt-5 min-h-8 text-center text-base font-semibold ${
          feedback === "correct"
            ? "text-ok"
            : feedback === "wrong"
              ? "text-bad"
              : "font-medium text-ink-muted"
        }`}
        aria-live="polite"
      >
        {feedback === "correct"
          ? `Yes! It’s ${expected}.`
          : feedback === "wrong"
            ? `Not quite. It’s ${expected}.`
            : "Type the digital time you see, then press Enter"}
      </p>

      <div
        className={`mt-3 rounded-2xl border-2 px-4 py-6 text-center sm:px-6 ${
          feedback === "correct"
            ? "animate-pop border-ok bg-ok-soft"
            : feedback === "wrong"
              ? "animate-shake border-bad bg-bad-soft"
              : "border-line bg-bg"
        }`}
      >
        <AnalogClock time={clock} />
        {feedback ? (
          <p className="mt-3 font-display text-3xl tabular-nums text-ink">
            {expected}
          </p>
        ) : null}
      </div>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="block text-sm font-semibold text-ink" htmlFor="time-answer">
          What time is it?
        </label>
        <input
          id="time-answer"
          ref={inputRef}
          value={input}
          onChange={(event) => onInput(event.target.value.slice(0, 5))}
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={Boolean(feedback)}
          placeholder="3:45"
          aria-describedby="time-answer-hint"
          className="mt-2 min-h-12 w-full rounded-xl border-2 border-line bg-bg px-3 text-center font-display text-2xl tabular-nums text-ink outline-none focus:border-secondary sm:text-3xl"
        />
        <p id="time-answer-hint" className="mt-2 text-sm text-ink-muted">
          Use hours and minutes, like 7:00 or 12:35. Press Enter to check.
        </p>
        <button
          type="submit"
          disabled={Boolean(feedback) || input.trim().length === 0}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-50 sm:w-auto"
        >
          Check
        </button>
      </form>

      <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ":", "0", "back"].map(
          (key) => (
            <button
              key={key}
              type="button"
              onClick={() => onPad(key)}
              className={`min-h-14 touch-manipulation rounded-xl text-lg font-semibold ${
                key === "back"
                  ? "border border-line bg-surface-muted text-ink"
                  : "border border-line bg-bg text-ink hover:border-accent/50"
              }`}
            >
              {key === "back" ? "⌫" : key}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPad("go")}
          className="col-span-3 min-h-14 touch-manipulation rounded-xl bg-accent text-lg font-semibold text-accent-ink"
        >
          OK
        </button>
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onFinish}
          className="min-h-11 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          {mode === "practice" ? "Finish practice" : "End early"}
        </button>
      </div>
    </div>
  );
}

function ResultsPanel({
  mode,
  stats,
  bestStreak,
  onAgain,
  onRetryMissed,
  onSetup,
}: {
  mode: Mode;
  stats: {
    attempted: number;
    correct: number;
    accuracy: number;
    missed: ClockTime[];
    slow: ClockTime[];
  };
  bestStreak: number;
  onAgain: () => void;
  onRetryMissed?: () => void;
  onSetup: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Nice work</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {mode === "timed"
          ? "Sixty seconds are up."
          : mode === "streak"
            ? "Streak ended on a miss — those are the times to keep."
            : "Here’s what this round looked like."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Correct" value={`${stats.correct}`} />
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Best streak" value={`${bestStreak}`} />
        <Stat label="Tried" value={`${stats.attempted}`} />
      </div>

      <TimeList
        title="Missed times"
        empty="No misses. That’s the goal."
        times={stats.missed}
      />
      <TimeList
        title="Slow times (4+ seconds)"
        empty="No slow times this round."
        times={stats.slow}
      />

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
        >
          Practice again
        </button>
        {onRetryMissed ? (
          <button
            type="button"
            onClick={onRetryMissed}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-ink"
          >
            Retry slow & missed
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSetup}
          className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          Change settings
        </button>
      </div>
    </div>
  );
}

function TimeList({
  title,
  empty,
  times,
}: {
  title: string;
  empty: string;
  times: ClockTime[];
}) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {times.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {times.map((time) => (
            <li
              key={timeKey(time)}
              className="rounded-lg border border-line bg-bg px-2.5 py-1 text-sm tabular-nums"
            >
              {formatTime(time)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AnalogClock({ time }: { time: ClockTime }) {
  const hour = (time.hour % 12) || 12;
  const minute = time.minute;
  const hourAngle = hour * 30 + minute * 0.5;
  const minuteAngle = minute * 6;

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label={clockDescription(time)}
        className="h-auto w-full"
      >
        <circle cx="100" cy="100" r="98" className="fill-bg-accent" />
        <circle
          cx="100"
          cy="100"
          r="86"
          className="fill-surface stroke-secondary"
          strokeWidth="5"
        />
        {Array.from({ length: 60 }, (_, index) => {
          const isHour = index % 5 === 0;
          const angle = index * 6;
          const outer = 82;
          const inner = isHour ? 70 : 77;
          const start = polar(100, 100, angle, inner);
          const end = polar(100, 100, angle, outer);
          return (
            <line
              key={index}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className={isHour ? "stroke-ink" : "stroke-line"}
              strokeWidth={isHour ? 2.4 : 1}
              strokeLinecap="round"
            />
          );
        })}
        {Array.from({ length: 12 }, (_, index) => {
          const numeral = index + 1;
          const point = polar(100, 100, numeral * 30, 58);
          return (
            <text
              key={numeral}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink font-sans text-[14px] font-bold"
            >
              {numeral}
            </text>
          );
        })}
        <ClockHand
          angle={hourAngle}
          length={42}
          width={6.5}
          className="stroke-secondary"
        />
        <ClockHand
          angle={minuteAngle}
          length={62}
          width={4}
          className="stroke-accent"
        />
        <circle cx="100" cy="100" r="6" className="fill-accent" />
        <circle cx="100" cy="100" r="2.4" className="fill-surface" />
      </svg>
    </div>
  );
}

function ClockHand({
  angle,
  length,
  width,
  className,
}: {
  angle: number;
  length: number;
  width: number;
  className: string;
}) {
  const tip = polar(100, 100, angle, length);
  const tail = polar(100, 100, angle + 180, 12);
  return (
    <line
      x1={tail.x}
      y1={tail.y}
      x2={tip.x}
      y2={tip.y}
      className={className}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

function polar(cx: number, cy: number, deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function ModeButton({
  title,
  detail,
  active,
  onClick,
}: {
  title: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-3 text-left ${
        active
          ? "border-accent bg-accent-soft"
          : "border-line bg-bg hover:border-accent/40"
      }`}
    >
      <span className="block font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-sm text-ink-muted">{detail}</span>
    </button>
  );
}
