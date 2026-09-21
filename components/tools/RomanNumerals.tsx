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
type Direction = "to-roman" | "to-arabic";
type DirectionMode = Direction | "mixed";

type Problem = {
  value: number;
  roman: string;
  direction: Direction;
};

type ProblemRecord = { problem: Problem; ms: number; correct: boolean };

const TOOL_SLUG = "roman-numerals";
const TIMED_SECONDS = 60;
const SLOW_MS = 4000;
const MAX_ROMAN_INPUT = 15;
const MAX_ARABIC_INPUT = 4;

const ROMAN_PAIRS: readonly [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

const CHART_SYMBOLS = [
  { symbol: "I", value: "1" },
  { symbol: "V", value: "5" },
  { symbol: "X", value: "10" },
  { symbol: "L", value: "50" },
  { symbol: "C", value: "100" },
  { symbol: "D", value: "500" },
  { symbol: "M", value: "1,000" },
] as const;

const CHART_SUBTRACTIVE = [
  { symbol: "IV", value: "4" },
  { symbol: "IX", value: "9" },
  { symbol: "XL", value: "40" },
  { symbol: "XC", value: "90" },
  { symbol: "CD", value: "400" },
  { symbol: "CM", value: "900" },
] as const;

const DIFFICULTIES: {
  id: Difficulty;
  title: string;
  detail: string;
}[] = [
  {
    id: "easy",
    title: "Easy",
    detail: "1–20 (I–XX). Arabic → Roman and Roman → Arabic.",
  },
  {
    id: "medium",
    title: "Medium",
    detail: "1–100 (I–C), including IV, IX, XL, and XC.",
  },
  {
    id: "challenge",
    title: "Challenge",
    detail: "1–3999 (I–MMMCMXCIX). Full subtractive rules.",
  },
];

const DIRECTIONS: {
  id: DirectionMode;
  title: string;
  detail: string;
}[] = [
  {
    id: "mixed",
    title: "Mixed",
    detail: "Both directions in one round.",
  },
  {
    id: "to-roman",
    title: "Arabic → Roman",
    detail: "See 14, type XIV.",
  },
  {
    id: "to-arabic",
    title: "Roman → Arabic",
    detail: "See XIV, type 14.",
  },
];

function toRoman(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return "";
  let remaining = n;
  let out = "";
  for (const [value, numeral] of ROMAN_PAIRS) {
    while (remaining >= value) {
      out += numeral;
      remaining -= value;
    }
  }
  return out;
}

function lettersOnly(raw: string) {
  return raw.toUpperCase().replace(/[^IVXLCDM]/g, "");
}

/** Parse a Roman string. Invalid or non-canonical forms (IIII, IC) return null. */
function fromRoman(raw: string): number | null {
  const roman = raw.toUpperCase().replace(/\s+/g, "");
  if (!/^[IVXLCDM]+$/.test(roman)) return null;
  let total = 0;
  let i = 0;
  for (const [value, numeral] of ROMAN_PAIRS) {
    if (roman.startsWith(numeral, i)) {
      total += value;
      i += numeral.length;
      if (numeral.length === 1) {
        let repeats = 1;
        while (roman.startsWith(numeral, i)) {
          repeats += 1;
          if (repeats > 3) return null;
          total += value;
          i += 1;
        }
      }
    }
  }
  if (i !== roman.length) return null;
  if (toRoman(total) !== roman) return null;
  return total;
}

function usesSubtractive(n: number) {
  return /IV|IX|XL|XC|CD|CM/.test(toRoman(n));
}

function pickFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function maxFor(difficulty: Difficulty) {
  if (difficulty === "easy") return 20;
  if (difficulty === "medium") return 100;
  return 3999;
}

function randomValue(difficulty: Difficulty) {
  const max = maxFor(difficulty);
  const wantSubtractive =
    difficulty === "easy" ? Math.random() < 0.4 : Math.random() < 0.5;

  if (difficulty === "challenge" && Math.random() < 0.35) {
    const high = randomInt(400, 3999);
    if (!wantSubtractive || usesSubtractive(high)) return high;
  }

  if (wantSubtractive) {
    for (let i = 0; i < 24; i += 1) {
      const n = randomInt(1, max);
      if (usesSubtractive(n)) return n;
    }
  }
  return randomInt(1, max);
}

function pickDirection(mode: DirectionMode): Direction {
  if (mode === "mixed") return Math.random() < 0.5 ? "to-roman" : "to-arabic";
  return mode;
}

function makeProblem(difficulty: Difficulty, directionMode: DirectionMode): Problem {
  const value = randomValue(difficulty);
  return {
    value,
    roman: toRoman(value),
    direction: pickDirection(directionMode),
  };
}

function problemKey(problem: Problem) {
  return `${problem.direction}:${problem.value}`;
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

function nextProblem(
  difficulty: Difficulty,
  directionMode: DirectionMode,
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

  let pick = makeProblem(difficulty, directionMode);
  for (let i = 0; i < 10 && last; i += 1) {
    if (!sameProblem(pick, last)) break;
    pick = makeProblem(difficulty, directionMode);
  }
  return pick;
}

function matchesAnswer(raw: string, problem: Problem) {
  if (problem.direction === "to-roman") {
    return fromRoman(raw) === problem.value;
  }

  const digits = raw.trim().replace(/[^\d]/g, "");
  if (!/^\d+$/.test(digits)) return false;
  return Number(digits) === problem.value;
}

function expectedLabel(problem: Problem) {
  return `${problem.value} is ${problem.roman}`;
}

function summarizeProblem(problem: Problem) {
  return problem.direction === "to-roman"
    ? `${problem.value} → ${problem.roman}`
    : `${problem.roman} → ${problem.value}`;
}

function promptFor(problem: Problem) {
  return problem.direction === "to-roman"
    ? "Write this number in Roman numerals."
    : "What number is this?";
}

function romanLettersFor(difficulty: Difficulty) {
  if (difficulty === "easy") return ["I", "V", "X"] as const;
  if (difficulty === "medium") return ["I", "V", "X", "L", "C"] as const;
  return ["I", "V", "X", "L", "C", "D", "M"] as const;
}

const SEED_PROBLEM: Problem = { value: 4, roman: "IV", direction: "to-roman" };

export function RomanNumerals() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [directionMode, setDirectionMode] = useState<DirectionMode>("mixed");
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [showChart, setShowChart] = useState(false);
  const [problem, setProblem] = useState<Problem>(SEED_PROBLEM);
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

  const expected = expectedLabel(problem);

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
      const first = nextProblem(difficulty, directionMode, null, retry);
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
    [difficulty, directionMode, mode],
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
        const upcoming = nextProblem(
          difficulty,
          directionMode,
          problem,
          focusProblems,
        );
        setProblem(upcoming);
        setInput("");
        setFeedback(null);
        shownAtRef.current = Date.now();
        busyRef.current = false;
        focusInput();
      }, delay);
    },
    [difficulty, directionMode, finishSession, focusProblems, mode, problem],
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

  const applyInput = (next: string) => {
    if (problem.direction === "to-roman") {
      setInput(lettersOnly(next).slice(0, MAX_ROMAN_INPUT));
      return;
    }
    setInput(next.replace(/[^\d]/g, "").slice(0, MAX_ARABIC_INPUT));
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
    applyInput(`${input}${value}`);
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
            difficulty={difficulty}
            directionMode={directionMode}
            mode={mode}
            onDifficulty={setDifficulty}
            onDirection={setDirectionMode}
            onMode={setMode}
            onStart={() => startSession()}
          />
        ) : null}

        {phase === "playing" ? (
          <PlayPanel
            difficulty={difficulty}
            mode={mode}
            problem={problem}
            expected={expected}
            input={input}
            inputRef={inputRef}
            feedback={feedback}
            streak={streak}
            stats={stats}
            timeLeft={timeLeft}
            onInput={applyInput}
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
          Show printable Roman numeral chart
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
          <RomanNumeralChart />
        </div>
      ) : null}

      <div className="mt-6 hidden print-only">
        <h2 className="mb-3 font-display text-2xl">Roman numeral chart</h2>
        <RomanNumeralChart />
      </div>
    </div>
  );
}

function SetupPanel({
  difficulty,
  directionMode,
  mode,
  onDifficulty,
  onDirection,
  onMode,
  onStart,
}: {
  difficulty: Difficulty;
  directionMode: DirectionMode;
  mode: Mode;
  onDifficulty: (difficulty: Difficulty) => void;
  onDirection: (direction: DirectionMode) => void;
  onMode: (mode: Mode) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose a level</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Start with 1–20. Then add subtractive pairs, then numbers through 3999.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
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

      <h3 className="mt-6 font-display text-xl text-ink">Direction</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {DIRECTIONS.map((item) => (
          <ModeButton
            key={item.id}
            title={item.title}
            detail={item.detail}
            active={directionMode === item.id}
            onClick={() => onDirection(item.id)}
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
  difficulty,
  mode,
  problem,
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
  difficulty: Difficulty;
  mode: Mode;
  problem: Problem;
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
  const askingRoman = problem.direction === "to-roman";
  const letters = romanLettersFor(difficulty);

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
          ? `Yes! ${expected}`
          : feedback === "wrong"
            ? `Not quite. ${expected}`
            : promptFor(problem)}
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
        <p
          className="font-display text-5xl tracking-wide text-ink sm:text-6xl"
          aria-label={
            askingRoman
              ? `Number ${problem.value}`
              : `Roman numeral ${problem.roman}`
          }
        >
          {askingRoman ? problem.value : problem.roman}
        </p>
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
          htmlFor="roman-numerals-answer"
        >
          {askingRoman ? "Roman numeral" : "Number"}
        </label>
        <input
          id="roman-numerals-answer"
          ref={inputRef}
          value={input}
          onChange={(event) => onInput(event.target.value)}
          inputMode={askingRoman ? "text" : "numeric"}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize={askingRoman ? "characters" : "none"}
          spellCheck={false}
          autoFocus
          disabled={Boolean(feedback)}
          placeholder={askingRoman ? "XIV" : "14"}
          aria-describedby="roman-numerals-answer-hint"
          className="mt-2 min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-center font-display text-2xl text-ink outline-none focus:border-secondary sm:text-3xl"
        />
        <p id="roman-numerals-answer-hint" className="mt-2 text-sm text-ink-muted">
          {askingRoman
            ? "Type the Roman numeral. Case does not matter. Press Enter to check."
            : "Type the number. Press Enter to check."}
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

      {askingRoman ? (
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
          {letters.map((letter) => (
            <button
              key={letter}
              type="button"
              aria-label={`Letter ${letter}`}
              onClick={() => onPad(letter)}
              className="min-h-14 touch-manipulation rounded-xl border border-line bg-bg text-lg font-semibold text-ink hover:border-accent/50"
            >
              {letter}
            </button>
          ))}
          <button
            type="button"
            aria-label="Delete"
            onClick={() => onPad("back")}
            className="min-h-14 touch-manipulation rounded-xl border border-line bg-surface-muted text-lg font-semibold text-ink"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => onPad("go")}
            className="min-h-14 touch-manipulation rounded-xl bg-accent text-lg font-semibold text-accent-ink"
          >
            OK
          </button>
        </div>
      ) : (
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
      )}
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
            ? "Streak ended on a miss — those are the numerals to keep."
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

function RomanNumeralChart() {
  return (
    <figure className="overflow-x-auto rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <figcaption className="mb-3 text-sm font-medium text-ink">
        Roman numeral chart — symbols and subtractive pairs
      </figcaption>
      <div className="grid gap-5 sm:grid-cols-2">
        <table className="w-full border-collapse text-center text-sm">
          <caption className="mb-2 text-left text-sm font-semibold text-ink">
            Values
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="border border-line bg-surface-muted px-2 py-2 font-semibold"
              >
                Symbol
              </th>
              <th
                scope="col"
                className="border border-line bg-surface-muted px-2 py-2 font-semibold"
              >
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {CHART_SYMBOLS.map((row) => (
              <tr key={row.symbol}>
                <td className="border border-line px-2 py-2 font-display text-lg">
                  {row.symbol}
                </td>
                <td className="border border-line px-2 py-2 tabular-nums">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="w-full border-collapse text-center text-sm">
          <caption className="mb-2 text-left text-sm font-semibold text-ink">
            Subtractive pairs
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="border border-line bg-surface-muted px-2 py-2 font-semibold"
              >
                Symbol
              </th>
              <th
                scope="col"
                className="border border-line bg-surface-muted px-2 py-2 font-semibold"
              >
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {CHART_SUBTRACTIVE.map((row) => (
              <tr key={row.symbol}>
                <td className="border border-line px-2 py-2 font-display text-lg">
                  {row.symbol}
                </td>
                <td className="border border-line px-2 py-2 tabular-nums">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        Example: 14 is XIV (10 + 4). 1999 is MCMXCIX. Write the largest values
        first; use subtractive pairs instead of four of the same symbol.
      </p>
      <table className="mt-4 w-full border-collapse text-center text-sm tabular-nums">
        <caption className="mb-2 text-left text-sm font-semibold text-ink">
          1–20
        </caption>
        <tbody>
          {chunk(
            Array.from({ length: 20 }, (_, index) => index + 1),
            5,
          ).map((row) => (
            <tr key={row.join("-")}>
              {row.map((n) => (
                <td key={n} className="border border-line px-1.5 py-2">
                  <span className="block text-xs text-ink-muted">{n}</span>
                  <span className="font-display text-base">{toRoman(n)}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
