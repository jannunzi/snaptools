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
type ModelKind = "pie" | "bar";
type CompareOp = "<" | "=" | ">";
type Fraction = { n: number; d: number };
type MixedNumber = { whole: number; n: number; d: number };

type IdentifyProblem = {
  kind: "identify";
  model: ModelKind;
  shaded: number;
  parts: number;
  answer: Fraction;
};

type SimplifyProblem = {
  kind: "simplify";
  fraction: Fraction;
  answer: Fraction;
};

type EquivalentProblem = {
  kind: "equivalent";
  fraction: Fraction;
  targetDenom: number;
  answer: Fraction;
};

type CompareProblem = {
  kind: "compare";
  left: Fraction;
  right: Fraction;
  answer: CompareOp;
};

type AddSubProblem = {
  kind: "addsub";
  left: Fraction;
  right: Fraction;
  op: "add" | "sub";
  answer: Fraction;
};

type ConvertProblem = {
  kind: "convert";
  direction: "improper-to-mixed" | "mixed-to-improper";
  improper: Fraction;
  mixed: MixedNumber;
};

type Problem =
  | IdentifyProblem
  | SimplifyProblem
  | EquivalentProblem
  | CompareProblem
  | AddSubProblem
  | ConvertProblem;

type FractionRecord = { problem: Problem; ms: number; correct: boolean };

const TIMED_SECONDS = 60;
const SLOW_MS = 4000;
const TOOL_SLUG = "fractions-practice";
const EASY_DENOMS = [2, 3, 4, 5, 8, 10] as const;
const COMMON_DENOMS = [2, 3, 4, 5, 6, 8, 10, 12] as const;

const DIFFICULTIES: {
  id: Difficulty;
  title: string;
  detail: string;
}[] = [
  {
    id: "easy",
    title: "Easy",
    detail: "Name the shaded pie or bar — halves through tenths.",
  },
  {
    id: "medium",
    title: "Medium",
    detail: "Simplify, name an equivalent, or compare two fractions.",
  },
  {
    id: "challenge",
    title: "Challenge",
    detail: "Add or subtract like denominators, or convert improper ↔ mixed.",
  },
];

function pickFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function reduce(fraction: Fraction): Fraction {
  const divisor = gcd(fraction.n, fraction.d);
  return { n: fraction.n / divisor, d: fraction.d / divisor };
}

function sameValue(left: Fraction, right: Fraction) {
  return left.n * right.d === right.n * left.d;
}

function isLowestTerms(fraction: Fraction) {
  return gcd(fraction.n, fraction.d) === 1 && fraction.d > 0;
}

function formatFraction(fraction: Fraction) {
  return `${fraction.n}/${fraction.d}`;
}

function formatMixed(mixed: MixedNumber) {
  if (mixed.n === 0) return String(mixed.whole);
  return `${mixed.whole} ${mixed.n}/${mixed.d}`;
}

function toMixed(improper: Fraction): MixedNumber {
  return {
    whole: Math.floor(improper.n / improper.d),
    n: improper.n % improper.d,
    d: improper.d,
  };
}

function fromMixed(mixed: MixedNumber): Fraction {
  return { n: mixed.whole * mixed.d + mixed.n, d: mixed.d };
}

function compareFractions(left: Fraction, right: Fraction): CompareOp {
  const cross = left.n * right.d - right.n * left.d;
  if (cross < 0) return "<";
  if (cross > 0) return ">";
  return "=";
}

function properReduced(denoms: readonly number[] = COMMON_DENOMS): Fraction {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const d = pickFrom(denoms);
    const n = randomInt(1, d - 1);
    const reduced = reduce({ n, d });
    if (reduced.d > 1) return reduced;
  }
  return { n: 1, d: 2 };
}

function problemKey(problem: Problem) {
  switch (problem.kind) {
    case "identify":
      return `identify:${problem.model}:${problem.shaded}/${problem.parts}`;
    case "simplify":
      return `simplify:${formatFraction(problem.fraction)}`;
    case "equivalent":
      return `equivalent:${formatFraction(problem.fraction)}:${problem.targetDenom}`;
    case "compare":
      return `compare:${formatFraction(problem.left)}${problem.answer}${formatFraction(problem.right)}`;
    case "addsub":
      return `addsub:${formatFraction(problem.left)}${problem.op}${formatFraction(problem.right)}`;
    case "convert":
      return `convert:${problem.direction}:${formatFraction(problem.improper)}`;
  }
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

function makeIdentify(): IdentifyProblem {
  const parts = pickFrom(EASY_DENOMS);
  const shaded = randomInt(1, parts);
  return {
    kind: "identify",
    model: Math.random() < 0.5 ? "pie" : "bar",
    shaded,
    parts,
    answer: { n: shaded, d: parts },
  };
}

function makeSimplify(): SimplifyProblem {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const base = properReduced([2, 3, 4, 5, 6, 8]);
    const factor = pickFrom([2, 3, 4, 5]);
    const fraction = { n: base.n * factor, d: base.d * factor };
    if (fraction.n > 24 || fraction.d > 24) continue;
    const answer = reduce(fraction);
    if (answer.n === fraction.n) continue;
    return { kind: "simplify", fraction, answer };
  }
  return {
    kind: "simplify",
    fraction: { n: 6, d: 8 },
    answer: { n: 3, d: 4 },
  };
}

function makeEquivalent(): EquivalentProblem {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const fraction = properReduced([2, 3, 4, 5, 6, 8]);
    const factor = pickFrom([2, 3, 4, 5]);
    const targetDenom = fraction.d * factor;
    if (targetDenom > 24) continue;
    return {
      kind: "equivalent",
      fraction,
      targetDenom,
      answer: { n: fraction.n * factor, d: targetDenom },
    };
  }
  return {
    kind: "equivalent",
    fraction: { n: 2, d: 5 },
    targetDenom: 15,
    answer: { n: 6, d: 15 },
  };
}

function makeCompare(): CompareProblem {
  const roll = Math.random();
  if (roll < 0.28) {
    const d = pickFrom([3, 4, 5, 6, 8, 10]);
    const left = { n: randomInt(1, d), d };
    const right = { n: randomInt(1, d), d };
    return {
      kind: "compare",
      left,
      right,
      answer: compareFractions(left, right),
    };
  }
  if (roll < 0.5) {
    const left = properReduced([2, 3, 4, 5, 6]);
    const factor = pickFrom([2, 3, 4]);
    const right = { n: left.n * factor, d: left.d * factor };
    return { kind: "compare", left, right, answer: "=" };
  }
  const left = properReduced([2, 3, 4, 5, 6, 8]);
  const right = properReduced([2, 3, 4, 5, 6, 8, 10]);
  return {
    kind: "compare",
    left,
    right,
    answer: compareFractions(left, right),
  };
}

function makeAddSub(): AddSubProblem {
  const d = pickFrom(COMMON_DENOMS);
  const op = Math.random() < 0.55 ? "add" : "sub";
  if (op === "add") {
    const left = { n: randomInt(1, d), d };
    const right = { n: randomInt(1, d), d };
    return {
      kind: "addsub",
      left,
      right,
      op,
      answer: { n: left.n + right.n, d },
    };
  }
  const leftN = randomInt(1, d);
  const rightN = randomInt(1, leftN);
  const left = { n: leftN, d };
  const right = { n: rightN, d };
  return {
    kind: "addsub",
    left,
    right,
    op,
    answer: { n: leftN - rightN, d },
  };
}

function makeConvert(): ConvertProblem {
  const d = pickFrom([2, 3, 4, 5, 6, 8]);
  const whole = randomInt(1, 4);
  const n = randomInt(1, d - 1);
  const mixed = { whole, n, d };
  const improper = fromMixed(mixed);
  return {
    kind: "convert",
    direction: Math.random() < 0.5 ? "improper-to-mixed" : "mixed-to-improper",
    improper,
    mixed,
  };
}

function generateProblem(difficulty: Difficulty): Problem {
  if (difficulty === "easy") return makeIdentify();
  if (difficulty === "medium") {
    const roll = Math.random();
    if (roll < 0.4) return makeSimplify();
    if (roll < 0.7) return makeEquivalent();
    return makeCompare();
  }
  return Math.random() < 0.5 ? makeAddSub() : makeConvert();
}

function nextProblem(
  difficulty: Difficulty,
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

  let pick = generateProblem(difficulty);
  for (let i = 0; i < 10 && last; i += 1) {
    if (!sameProblem(pick, last)) break;
    pick = generateProblem(difficulty);
  }
  return pick;
}

type ParsedAnswer =
  | { kind: "fraction"; fraction: Fraction; form: "simple" | "mixed" }
  | { kind: "compare"; op: CompareOp };

function parseCompare(raw: string): CompareOp | null {
  const value = raw.trim().toLowerCase();
  if (value === "<" || value === "less" || value === "lt") return "<";
  if (value === "=" || value === "==" || value === "equal" || value === "equals") {
    return "=";
  }
  if (value === ">" || value === "greater" || value === "gt") return ">";
  return null;
}

function parseAnswer(raw: string): ParsedAnswer | null {
  const compare = parseCompare(raw);
  if (compare) return { kind: "compare", op: compare };

  const trimmed = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const mixed = trimmed.match(/^(\d+)\s*[-\s+]\s*(\d+)\s*[/⁄]\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const n = Number(mixed[2]);
    const d = Number(mixed[3]);
    if (d > 0 && Number.isInteger(whole) && Number.isInteger(n)) {
      return {
        kind: "fraction",
        fraction: fromMixed({ whole, n, d }),
        form: "mixed",
      };
    }
  }

  const compact = trimmed.replace(/\s+/g, "");
  const simple = compact.match(/^(\d+)[/⁄](\d+)$/);
  if (simple) {
    const n = Number(simple[1]);
    const d = Number(simple[2]);
    if (d > 0 && Number.isInteger(n)) {
      return { kind: "fraction", fraction: { n, d }, form: "simple" };
    }
  }

  if (/^\d+$/.test(compact)) {
    return {
      kind: "fraction",
      fraction: { n: Number(compact), d: 1 },
      form: "simple",
    };
  }

  return null;
}

function expectedLabel(problem: Problem) {
  switch (problem.kind) {
    case "identify": {
      const reduced = reduce(problem.answer);
      if (reduced.n === problem.answer.n && reduced.d === problem.answer.d) {
        return formatFraction(problem.answer);
      }
      return `${formatFraction(problem.answer)} = ${formatFraction(reduced)}`;
    }
    case "simplify":
      return `${formatFraction(problem.fraction)} = ${formatFraction(problem.answer)}`;
    case "equivalent":
      return `${formatFraction(problem.fraction)} = ${formatFraction(problem.answer)}`;
    case "compare":
      return `${formatFraction(problem.left)} ${problem.answer} ${formatFraction(problem.right)}`;
    case "addsub": {
      const sign = problem.op === "add" ? "+" : "−";
      const reduced = reduce(problem.answer);
      const sum = formatFraction(problem.answer);
      const extra =
        reduced.n === problem.answer.n && reduced.d === problem.answer.d
          ? ""
          : ` = ${formatFraction(reduced)}`;
      return `${formatFraction(problem.left)} ${sign} ${formatFraction(problem.right)} = ${sum}${extra}`;
    }
    case "convert":
      return problem.direction === "improper-to-mixed"
        ? `${formatFraction(problem.improper)} = ${formatMixed(problem.mixed)}`
        : `${formatMixed(problem.mixed)} = ${formatFraction(problem.improper)}`;
  }
}

function matchesAnswer(raw: string, problem: Problem) {
  const parsed = parseAnswer(raw);
  if (!parsed) return false;

  if (problem.kind === "compare") {
    return parsed.kind === "compare" && parsed.op === problem.answer;
  }

  if (parsed.kind !== "fraction") return false;

  if (problem.kind === "identify") {
    return sameValue(parsed.fraction, problem.answer);
  }

  if (problem.kind === "simplify") {
    return (
      sameValue(parsed.fraction, problem.answer) &&
      isLowestTerms(parsed.fraction)
    );
  }

  if (problem.kind === "equivalent") {
    return (
      parsed.fraction.d === problem.answer.d &&
      parsed.fraction.n === problem.answer.n
    );
  }

  if (problem.kind === "addsub") {
    return sameValue(parsed.fraction, problem.answer);
  }

  if (problem.direction === "improper-to-mixed") {
    return (
      parsed.form === "mixed" &&
      sameValue(parsed.fraction, problem.improper)
    );
  }

  return (
    parsed.form === "simple" &&
    sameValue(parsed.fraction, problem.improper)
  );
}

function promptFor(problem: Problem) {
  switch (problem.kind) {
    case "identify":
      return "What fraction is shaded?";
    case "simplify":
      return "Write this fraction in lowest terms.";
    case "equivalent":
      return `Write a fraction equal to ${formatFraction(problem.fraction)} with denominator ${problem.targetDenom}.`;
    case "compare":
      return "Compare the two fractions.";
    case "addsub":
      return problem.op === "add"
        ? "Add the fractions."
        : "Subtract the fractions.";
    case "convert":
      return problem.direction === "improper-to-mixed"
        ? "Write the mixed number."
        : "Write the improper fraction.";
  }
}

function inputHint(problem: Problem) {
  if (problem.kind === "compare") {
    return "Tap <, =, or >, or type the symbol and press Enter.";
  }
  if (problem.kind === "convert" && problem.direction === "improper-to-mixed") {
    return "Type a mixed number like 1 3/4. Press Enter to check.";
  }
  return "Type a fraction like 3/4. Press Enter to check.";
}

function inputPlaceholder(problem: Problem) {
  if (problem.kind === "compare") return "<  =  >";
  if (problem.kind === "convert" && problem.direction === "improper-to-mixed") {
    return "1 3/4";
  }
  if (problem.kind === "equivalent") {
    return `?/${problem.targetDenom}`;
  }
  return "3/4";
}

function inputLabel(problem: Problem) {
  if (problem.kind === "compare") return "Comparison";
  if (problem.kind === "convert" && problem.direction === "improper-to-mixed") {
    return "Mixed number";
  }
  return "Fraction";
}

function summarizeProblem(problem: Problem) {
  return expectedLabel(problem);
}

function modelDescription(parts: number, shaded: number, model: ModelKind) {
  const shape = model === "pie" ? "Circle" : "Bar";
  return `${shape} divided into ${parts} equal parts with ${shaded} part${shaded === 1 ? "" : "s"} shaded.`;
}

export function FractionsPractice() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [problem, setProblem] = useState<Problem>(() => makeIdentify());
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [records, setRecords] = useState<FractionRecord[]>([]);
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
      const first = nextProblem(difficulty, null, retry);
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
      const correct = matchesAnswer(value, problem);
      const ms = Date.now() - shownAtRef.current;
      const record: FractionRecord = { problem, ms, correct };

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
        const upcoming = nextProblem(difficulty, problem, focusProblems);
        setProblem(upcoming);
        setInput("");
        setFeedback(null);
        shownAtRef.current = Date.now();
        busyRef.current = false;
        focusInput();
      }, delay);
    },
    [difficulty, finishSession, focusProblems, mode, problem],
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
    setInput((prev) => (prev.length >= 10 ? prev : `${prev}${value}`));
    focusInput();
  };

  const retryProblems = uniqueProblems([...stats.missed, ...stats.slow]);

  return (
    <div className="no-print snap-panel">
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
          problem={problem}
          expected={expected}
          input={input}
          inputRef={inputRef}
          feedback={feedback}
          streak={streak}
          stats={stats}
          timeLeft={timeLeft}
          onInput={setInput}
          onSubmit={() => submitAnswer(input)}
          onSubmitValue={submitAnswer}
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
      <h2 className="font-display text-2xl text-ink">Choose a level</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Start by naming a shaded pie or bar. Then simplify, compare, and operate.
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
  onSubmitValue,
  onPad,
  onFinish,
}: {
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
  onSubmitValue: (value: string) => void;
  onPad: (value: string) => void;
  onFinish: () => void;
}) {
  const isCompare = problem.kind === "compare";

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
        <ProblemVisual problem={problem} />
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
          htmlFor="fraction-answer"
        >
          {inputLabel(problem)}
        </label>
        <input
          id="fraction-answer"
          ref={inputRef}
          value={input}
          onChange={(event) => onInput(event.target.value.slice(0, 10))}
          inputMode={isCompare ? "text" : "numeric"}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={Boolean(feedback)}
          placeholder={inputPlaceholder(problem)}
          aria-describedby="fraction-answer-hint"
          className="mt-2 min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-center font-display text-2xl tabular-nums text-ink outline-none focus:border-secondary sm:text-3xl"
        />
        <FractionPreview input={input} problem={problem} />
        <p id="fraction-answer-hint" className="mt-2 text-sm text-ink-muted">
          {inputHint(problem)}
        </p>
        {isCompare ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(
              [
                { op: "<" as const, label: "Less than" },
                { op: "=" as const, label: "Equal to" },
                { op: ">" as const, label: "Greater than" },
              ] as const
            ).map((item) => (
              <button
                key={item.op}
                type="button"
                aria-label={item.label}
                disabled={Boolean(feedback)}
                onClick={() => onSubmitValue(item.op)}
                className="min-h-14 rounded-xl border border-line bg-bg text-2xl font-semibold text-ink hover:border-accent/50 disabled:opacity-50"
              >
                {item.op}
                <span className="mt-0.5 block text-xs font-medium text-ink-muted">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        ) : null}
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

      {!isCompare ? (
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "/", "0", "back"].map(
            (key) => (
              <button
                key={key}
                type="button"
                aria-label={
                  key === "back"
                    ? "Delete"
                    : key === "/"
                      ? "Fraction bar"
                      : `Digit ${key}`
                }
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
            aria-label="Space for mixed number"
            onClick={() => onPad(" ")}
            className="min-h-14 touch-manipulation rounded-xl border border-line bg-bg text-sm font-semibold text-ink hover:border-accent/50"
          >
            space
          </button>
          <button
            type="button"
            onClick={() => onPad("go")}
            className="col-span-2 min-h-14 touch-manipulation rounded-xl bg-accent text-lg font-semibold text-accent-ink"
          >
            OK
          </button>
        </div>
      ) : null}
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
            ? "Streak ended on a miss — those are the problems to keep."
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

function ProblemVisual({ problem }: { problem: Problem }) {
  if (problem.kind === "identify") {
    return (
      <FractionModel
        parts={problem.parts}
        shaded={problem.shaded}
        model={problem.model}
      />
    );
  }

  if (problem.kind === "simplify") {
    return (
      <div className="flex flex-col items-center gap-4">
        <FractionNotation fraction={problem.fraction} size="lg" />
        <FractionModel
          parts={problem.fraction.d}
          shaded={problem.fraction.n}
          model="bar"
        />
      </div>
    );
  }

  if (problem.kind === "equivalent") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        <FractionNotation fraction={problem.fraction} size="lg" />
        <span className="font-display text-3xl text-ink">=</span>
        <span className="inline-flex flex-col items-center text-ink">
          <span className="font-display text-3xl tabular-nums">?</span>
          <span className="my-1 block h-px w-10 bg-ink" />
          <span className="font-display text-3xl tabular-nums">
            {problem.targetDenom}
          </span>
        </span>
        <FractionModel
          parts={problem.fraction.d}
          shaded={problem.fraction.n}
          model="pie"
        />
      </div>
    );
  }

  if (problem.kind === "compare") {
    return (
      <div className="flex flex-wrap items-end justify-center gap-5">
        <div className="flex flex-col items-center gap-3">
          <FractionNotation fraction={problem.left} />
          <FractionModel
            parts={problem.left.d}
            shaded={problem.left.n}
            model="bar"
            compact
          />
        </div>
        <span className="mb-6 font-display text-3xl text-ink-muted">?</span>
        <div className="flex flex-col items-center gap-3">
          <FractionNotation fraction={problem.right} />
          <FractionModel
            parts={problem.right.d}
            shaded={problem.right.n}
            model="bar"
            compact
          />
        </div>
      </div>
    );
  }

  if (problem.kind === "addsub") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <div className="flex flex-col items-center gap-3">
          <FractionNotation fraction={problem.left} />
          <FractionModel
            parts={problem.left.d}
            shaded={problem.left.n}
            model="bar"
            compact
          />
        </div>
        <span className="font-display text-3xl text-ink">
          {problem.op === "add" ? "+" : "−"}
        </span>
        <div className="flex flex-col items-center gap-3">
          <FractionNotation fraction={problem.right} />
          <FractionModel
            parts={problem.right.d}
            shaded={problem.right.n}
            model="bar"
            compact
          />
        </div>
        <span className="font-display text-3xl text-ink">=</span>
        <span className="font-display text-3xl text-ink-muted">?</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <FractionNotation
        fraction={
          problem.direction === "improper-to-mixed"
            ? problem.improper
            : fromMixed(problem.mixed)
        }
        mixed={
          problem.direction === "mixed-to-improper" ? problem.mixed : undefined
        }
        size="lg"
      />
      <ImproperPies fraction={problem.improper} />
    </div>
  );
}

function FractionNotation({
  fraction,
  mixed,
  size = "md",
}: {
  fraction: Fraction;
  mixed?: MixedNumber;
  size?: "md" | "lg";
}) {
  const numClass = size === "lg" ? "text-4xl" : "text-3xl";
  const barClass = size === "lg" ? "w-12" : "w-10";

  if (mixed) {
    return (
      <span className="inline-flex items-center gap-2 text-ink">
        <span className={`font-display tabular-nums ${numClass}`}>
          {mixed.whole}
        </span>
        <span className="inline-flex flex-col items-center">
          <span className={`font-display tabular-nums ${numClass}`}>
            {mixed.n}
          </span>
          <span className={`my-1 block h-px bg-ink ${barClass}`} />
          <span className={`font-display tabular-nums ${numClass}`}>
            {mixed.d}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-center text-ink">
      <span className={`font-display tabular-nums ${numClass}`}>
        {fraction.n}
      </span>
      <span className={`my-1 block h-px bg-ink ${barClass}`} />
      <span className={`font-display tabular-nums ${numClass}`}>
        {fraction.d}
      </span>
    </span>
  );
}

function FractionPreview({
  input,
  problem,
}: {
  input: string;
  problem: Problem;
}) {
  if (problem.kind === "compare") return null;
  const parsed = parseAnswer(input);
  if (!parsed || parsed.kind !== "fraction") return null;

  return (
    <div className="mt-3 flex justify-center" aria-hidden="true">
      <FractionNotation
        fraction={parsed.fraction}
        mixed={parsed.form === "mixed" ? toMixed(parsed.fraction) : undefined}
        size="md"
      />
    </div>
  );
}

function FractionModel({
  parts,
  shaded,
  model,
  compact = false,
}: {
  parts: number;
  shaded: number;
  model: ModelKind;
  compact?: boolean;
}) {
  const label = modelDescription(parts, shaded, model);
  if (model === "bar") {
    return <FractionBar parts={parts} shaded={shaded} label={label} compact={compact} />;
  }
  return <FractionPie parts={parts} shaded={shaded} label={label} compact={compact} />;
}

function FractionBar({
  parts,
  shaded,
  label,
  compact,
}: {
  parts: number;
  shaded: number;
  label: string;
  compact: boolean;
}) {
  const unit = 40;
  const width = Math.max(parts * unit, unit);
  return (
    <svg
      viewBox={`0 0 ${width} 48`}
      role="img"
      aria-label={label}
      className={`mx-auto h-auto ${compact ? "w-36 sm:w-44" : "w-full max-w-md"}`}
    >
      {Array.from({ length: parts }, (_, index) => (
        <rect
          key={index}
          x={index * unit + 1.5}
          y={6}
          width={unit - 3}
          height={36}
          rx={5}
          className={index < shaded ? "fill-secondary" : "fill-surface"}
          stroke="currentColor"
          strokeWidth="1.25"
        />
      ))}
    </svg>
  );
}

function FractionPie({
  parts,
  shaded,
  label,
  compact,
}: {
  parts: number;
  shaded: number;
  label: string;
  compact: boolean;
}) {
  const wedges = pieWedges(parts, shaded);
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={label}
      className={`mx-auto h-auto ${compact ? "w-28" : "w-44 sm:w-52"}`}
    >
      <circle cx="100" cy="100" r="94" className="fill-surface-muted" />
      {wedges.map((wedge) => (
        <path
          key={wedge.key}
          d={wedge.d}
          className={wedge.shaded ? "fill-secondary" : "fill-surface"}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
      <circle
        cx="100"
        cy="100"
        r="94"
        className="fill-none stroke-line"
        strokeWidth="2"
      />
    </svg>
  );
}

function ImproperPies({ fraction }: { fraction: Fraction }) {
  const wholes = Math.floor(fraction.n / fraction.d);
  const remainder = fraction.n % fraction.d;
  const pies = Array.from({ length: wholes }, () => ({
    shaded: fraction.d,
    parts: fraction.d,
  }));
  if (remainder > 0 || pies.length === 0) {
    pies.push({ shaded: remainder, parts: fraction.d });
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {pies.map((pie, index) => (
        <FractionPie
          key={`${index}-${pie.shaded}-${pie.parts}`}
          parts={pie.parts}
          shaded={pie.shaded}
          label={modelDescription(pie.parts, pie.shaded, "pie")}
          compact={pies.length > 1}
        />
      ))}
    </div>
  );
}

function pieWedges(parts: number, shaded: number) {
  if (parts <= 0) return [];
  if (parts === 1) {
    return [
      {
        key: "full",
        d: "M 100 6 A 94 94 0 1 1 99.999 6 Z",
        shaded: shaded > 0,
      },
    ];
  }

  const sweep = 360 / parts;
  return Array.from({ length: parts }, (_, index) => {
    const start = index * sweep;
    const end = (index + 1) * sweep;
    return {
      key: `${index}`,
      d: wedgePath(100, 100, 94, start, end),
      shaded: index < shaded,
    };
  });
}

function wedgePath(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
) {
  const start = polar(cx, cy, startDeg, radius);
  const end = polar(cx, cy, endDeg, radius);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 ${large} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`;
}

function polar(cx: number, cy: number, deg: number, radius: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
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
