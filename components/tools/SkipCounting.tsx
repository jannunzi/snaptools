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
type Difficulty = "easy" | "medium" | "challenge";

type Problem = {
  skip: number;
  terms: number[];
  blankIndex: number;
};

type ProblemRecord = { problem: Problem; ms: number; correct: boolean };

const TOOL_SLUG = "skip-counting";
const TIMED_SECONDS = 60;
const SLOW_MS = 4000;
const SEQUENCE_LENGTH = 4;
const MAX_INPUT = 5;

const ALL_SKIPS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 100] as const;

const EASY = [2, 5, 10];
const MEDIUM = [2, 3, 4, 5, 10];
const CHALLENGE = [6, 7, 8, 9, 25, 100];

const PRESETS: {
  id: Difficulty;
  skips: number[];
  title: string;
  detail: string;
}[] = [
  {
    id: "easy",
    skips: EASY,
    title: "Easy",
    detail: "Count by 2s, 5s, and 10s — within about 0–100.",
  },
  {
    id: "medium",
    skips: MEDIUM,
    title: "Medium",
    detail: "Add 3s and 4s. Stay near 0–120.",
  },
  {
    id: "challenge",
    skips: CHALLENGE,
    title: "Challenge",
    detail: "6–9, plus 25s and 100s, on a wider range.",
  },
];

const CHART_SKIPS = [2, 5, 10] as const;

function pickFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function sameSet(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  return left.every((n, index) => n === right[index]);
}

function rangeForSkip(skip: number) {
  if (skip === 2 || skip === 5 || skip === 10) return 100;
  if (skip === 3 || skip === 4) return 120;
  if (skip >= 6 && skip <= 9) return 180;
  if (skip === 25) return 500;
  return 1000;
}

function problemKey(problem: Problem) {
  return `${problem.skip}:${problem.terms.join(",")}:${problem.blankIndex}`;
}

function sameProblem(left: Problem, right: Problem) {
  return problemKey(left) === problemKey(right);
}

function uniqueProblems(problems: Problem[]) {
  const seen = new Set<string>();
  return problems.filter((problem) => {
    const key = problemKey(problem);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function expectedOf(problem: Problem) {
  return problem.terms[problem.blankIndex] ?? 0;
}

function formatSequence(problem: Problem) {
  return problem.terms
    .map((term, index) => (index === problem.blankIndex ? "□" : String(term)))
    .join(", ");
}

function summarizeProblem(problem: Problem) {
  return `Count by ${problem.skip}s: ${formatSequence(problem)} → ${expectedOf(problem)}`;
}

function generateProblem(skips: number[]): Problem {
  const pool = skips.length > 0 ? skips : EASY;
  const skip = pickFrom(pool);
  const max = rangeForSkip(skip);
  const maxStart = Math.max(0, max - skip * (SEQUENCE_LENGTH - 1));
  const maxStep = Math.floor(maxStart / skip);
  const start = randomInt(0, Math.max(0, maxStep)) * skip;
  const terms = Array.from(
    { length: SEQUENCE_LENGTH },
    (_, index) => start + skip * index,
  );
  return {
    skip,
    terms,
    blankIndex: randomInt(0, SEQUENCE_LENGTH - 1),
  };
}

function nextProblem(
  skips: number[],
  last: Problem | null,
  focus?: Problem[],
): Problem {
  const pool = focus && focus.length > 0 ? focus : null;
  if (pool) {
    let pick = pickFrom(pool);
    for (let i = 0; i < 8 && last && pool.length > 1; i += 1) {
      if (!sameProblem(pick, last)) break;
      pick = pickFrom(pool);
    }
    return pick;
  }

  let pick = generateProblem(skips);
  for (let i = 0; i < 10 && last; i += 1) {
    if (!sameProblem(pick, last)) break;
    pick = generateProblem(skips);
  }
  return pick;
}

function normalizeAnswer(raw: string) {
  return raw.trim().replace(/,/g, "").replace(/\s+/g, "");
}

function matchesAnswer(raw: string, problem: Problem) {
  const value = normalizeAnswer(raw);
  if (!/^\d+$/.test(value)) return false;
  return Number(value) === expectedOf(problem);
}

export function SkipCounting() {
  const [skips, setSkips] = useState<number[]>(EASY);
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [showChart, setShowChart] = useState(false);
  const [problem, setProblem] = useState<Problem>({
    skip: 2,
    terms: [2, 4, 6, 8],
    blankIndex: 2,
  });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [records, setRecords] = useState<ProblemRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMED_SECONDS);
  const [focusProblems, setFocusProblems] = useState<Problem[] | undefined>(
    undefined,
  );

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

  const expectedLabel = `Count by ${problem.skip}s: ${problem.terms.join(", ")}`;

  const stats = useMemo(() => {
    const attempted = records.length;
    const correct = records.filter((item) => item.correct).length;
    const missed = uniqueProblems(
      records.filter((item) => !item.correct).map((item) => item.problem),
    );
    const slow = uniqueProblems(
      records
        .filter((item) => item.correct && item.ms >= SLOW_MS)
        .map((item) => item.problem),
    );
    const accuracy =
      attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
    return { attempted, correct, missed, slow, accuracy };
  }, [records]);

  const focusInput = () => {
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const startSession = useCallback(
    (retry?: Problem[]) => {
      trackEvent(analyticsEvents.practiceStart, {
        tool: TOOL_SLUG,
        mode,
      });
      const selected = skips.length > 0 ? skips : EASY;
      if (skips.length === 0) setSkips(EASY);
      const first = nextProblem(selected, null, retry);
      setFocusProblems(retry);
      setProblem(first);
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
    [mode, skips],
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
      const correct = matchesAnswer(value, problem);
      const ms = Date.now() - shownAtRef.current;
      const record: ProblemRecord = { problem, ms, correct };

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

      const delay =
        mode === "timed" ? (correct ? 700 : 1100) : correct ? 2000 : 2800;

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
        const upcoming = nextProblem(skips, problem, focusProblems);
        setProblem(upcoming);
        setInput("");
        setFeedback(null);
        shownAtRef.current = Date.now();
        busyRef.current = false;
        focusInput();
      }, delay);
    },
    [finishSession, focusProblems, mode, problem, skips],
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
  }, [feedback, phase, problem]);

  const toggleSkip = (n: number) => {
    setSkips((prev) =>
      prev.includes(n)
        ? prev.filter((item) => item !== n)
        : [...prev, n].sort((a, b) => a - b),
    );
  };

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
    setInput((prev) => (prev.length >= MAX_INPUT ? prev : `${prev}${value}`));
    focusInput();
  };

  const printChart = () => {
    trackEvent(analyticsEvents.printChart, { tool: TOOL_SLUG });
    setShowChart(true);
    window.setTimeout(() => window.print(), 50);
  };

  const retryProblems = uniqueProblems([...stats.missed, ...stats.slow]);

  return (
    <div>
      <div className="no-print snap-panel">
        {phase === "setup" ? (
          <SetupPanel
            skips={skips}
            mode={mode}
            onToggleSkip={toggleSkip}
            onPreset={setSkips}
            onMode={setMode}
            onStart={() => startSession()}
          />
        ) : null}

        {phase === "playing" ? (
          <PlayPanel
            mode={mode}
            problem={problem}
            expectedLabel={expectedLabel}
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
            onAgain={() => startSession(focusProblems)}
            onRetryMissed={
              retryProblems.length > 0
                ? () => startSession(retryProblems)
                : undefined
            }
            onSetup={() => {
              setPhase("setup");
              setFocusProblems(undefined);
            }}
          />
        ) : null}
      </div>

      <div className="no-print mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="size-4 accent-[var(--accent)]"
            checked={showChart}
            onChange={(event) => setShowChart(event.target.checked)}
          />
          Show printable skip-counting chart
        </label>
        <button
          type="button"
          onClick={printChart}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-accent/50"
        >
          Print chart
        </button>
      </div>

      {showChart ? (
        <div className="no-print mt-4">
          <SkipCountingChart />
        </div>
      ) : null}

      <div className="mt-6 hidden print-only">
        <h2 className="mb-3 font-display text-2xl">Skip-counting chart</h2>
        <SkipCountingChart />
      </div>
    </div>
  );
}

function SetupPanel({
  skips,
  mode,
  onToggleSkip,
  onPreset,
  onMode,
  onStart,
}: {
  skips: number[];
  mode: Mode;
  onToggleSkip: (n: number) => void;
  onPreset: (skips: number[]) => void;
  onMode: (mode: Mode) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose skips</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Start with 2s, 5s, and 10s. Tap a skip to add or remove it.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {PRESETS.map((item) => (
          <ModeButton
            key={item.id}
            title={item.title}
            detail={item.detail}
            active={sameSet(skips, item.skips)}
            onClick={() => onPreset(item.skips)}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {ALL_SKIPS.map((n) => {
          const selected = skips.includes(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onToggleSkip(n)}
              aria-pressed={selected}
              className={`min-h-12 rounded-xl border text-base font-semibold ${
                selected
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line bg-bg text-ink hover:border-accent/50"
              }`}
            >
              {n}
            </button>
          );
        })}
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
        disabled={skips.length === 0}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-50 sm:w-auto"
      >
        Start
      </button>
    </div>
  );
}

function PlayPanel({
  mode,
  problem,
  expectedLabel,
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
  problem: Problem;
  expectedLabel: string;
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
          ? `Yes! ${expectedLabel}`
          : feedback === "wrong"
            ? `Not quite. ${expectedLabel}`
            : `What number is missing? Count by ${problem.skip}s.`}
      </p>

      <div
        className={`mt-3 rounded-2xl border px-4 py-6 text-center sm:px-6 ${
          feedback === "correct"
            ? "animate-pop border-ok bg-ok-soft"
            : feedback === "wrong"
              ? "animate-shake border-bad bg-bad-soft"
              : "border-line bg-bg"
        }`}
      >
        <SequenceVisual problem={problem} input={input} feedback={feedback} />
      </div>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor="skip-counting-answer"
        >
          Missing number
        </label>
        <input
          id="skip-counting-answer"
          ref={inputRef}
          value={input}
          onChange={(event) =>
            onInput(event.target.value.replace(/[^\d]/g, "").slice(0, MAX_INPUT))
          }
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={Boolean(feedback)}
          placeholder="12"
          aria-describedby="skip-counting-answer-hint"
          className="mt-2 min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-center font-display text-2xl text-ink outline-none focus:border-secondary sm:text-3xl"
        />
        <p id="skip-counting-answer-hint" className="mt-2 text-sm text-ink-muted">
          Type the missing number. Press Enter to check.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={Boolean(feedback) || input.trim().length === 0}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-50 sm:w-auto"
          >
            Check
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex min-h-12 items-center justify-center px-3 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            {mode === "practice" ? "Finish practice" : "End early"}
          </button>
        </div>
      </form>

      <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "go"].map(
          (key) => (
            <button
              key={key}
              type="button"
              aria-label={
                key === "back"
                  ? "Delete"
                  : key === "go"
                    ? "Check answer"
                    : `Digit ${key}`
              }
              onClick={() => onPad(key)}
              className={`min-h-14 touch-manipulation rounded-xl text-lg font-semibold ${
                key === "go"
                  ? "bg-accent text-accent-ink"
                  : key === "back"
                    ? "border border-line bg-surface-muted text-ink"
                    : "border border-line bg-bg text-ink hover:border-accent/50"
              }`}
            >
              {key === "back" ? "⌫" : key === "go" ? "OK" : key}
            </button>
          ),
        )}
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
    missed: Problem[];
    slow: Problem[];
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
            ? "Streak ended on a miss — those are the sequences to keep."
            : "Here’s what this round looked like."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Correct" value={`${stats.correct}`} />
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Best streak" value={`${bestStreak}`} />
        <Stat label="Tried" value={`${stats.attempted}`} />
      </div>

      <ProblemList
        title="Missed items"
        empty="No misses. That’s the goal."
        problems={stats.missed}
      />
      <ProblemList
        title="Slow items (4+ seconds)"
        empty="No slow items this round."
        problems={stats.slow}
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

function ProblemList({
  title,
  empty,
  problems,
}: {
  title: string;
  empty: string;
  problems: Problem[];
}) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {problems.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {problems.map((problem) => (
            <li
              key={problemKey(problem)}
              className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm tabular-nums"
            >
              {summarizeProblem(problem)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SequenceVisual({
  problem,
  input,
  feedback,
}: {
  problem: Problem;
  input: string;
  feedback: "correct" | "wrong" | null;
}) {
  const shown = problem.terms.map((term, index) => {
    if (index !== problem.blankIndex) return String(term);
    if (feedback === "wrong") return String(expectedOf(problem));
    return input || "?";
  });

  return (
    <p
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 font-display text-4xl tabular-nums tracking-wide text-ink sm:gap-x-3 sm:text-5xl"
      aria-label={`Count by ${problem.skip}s: ${formatSequence(problem)}`}
    >
      {shown.map((term, index) => {
        const isBlank = index === problem.blankIndex;
        return (
          <span key={`${problemKey(problem)}-${index}`} className="inline-flex items-center">
            {index > 0 ? (
              <span className="mr-2 text-2xl text-ink-muted sm:mr-3 sm:text-3xl">
                ,
              </span>
            ) : null}
            <span
              className={
                isBlank
                  ? `inline-block min-w-[2.4ch] border-b-[3px] px-[0.08em] ${
                      feedback === "correct"
                        ? "border-ok text-ok"
                        : feedback === "wrong"
                          ? "border-bad text-bad"
                          : "border-secondary text-secondary"
                    }`
                  : "inline-block px-[0.08em]"
              }
            >
              {term}
            </span>
          </span>
        );
      })}
    </p>
  );
}

function SkipCountingChart() {
  return (
    <figure className="overflow-x-auto rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <figcaption className="mb-3 text-sm font-medium text-ink">
        Skip-counting chart — by 2s, 5s, and 10s through 100
      </figcaption>
      <div className="flex flex-col gap-5">
        {CHART_SKIPS.map((skip) => {
          const values = Array.from(
            { length: 100 / skip },
            (_, index) => skip * (index + 1),
          );
          const columns = skip === 10 ? 5 : 10;
          return (
            <table
              key={skip}
              className="w-full border-collapse text-center text-sm tabular-nums"
            >
              <caption className="mb-2 text-left text-sm font-semibold text-ink">
                Count by {skip}s
              </caption>
              <tbody>
                {chunk(values, columns).map((row, rowIndex) => (
                  <tr key={`${skip}-${rowIndex}`}>
                    {row.map((value) => (
                      <td
                        key={value}
                        className="border border-line px-1.5 py-2 font-display text-base"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
    </figure>
  );
}

function chunk<T>(items: readonly T[], size: number) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
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
