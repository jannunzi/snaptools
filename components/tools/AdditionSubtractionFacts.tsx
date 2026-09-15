"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdditionChart } from "@/components/tools/AdditionChart";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

type Mode = "practice" | "timed" | "streak";
type Phase = "setup" | "playing" | "results";
type Op = "add" | "sub";
type RangeId = "easy" | "medium" | "challenge";
type Fact = { a: number; b: number; op: Op };
type FactRecord = Fact & { ms: number; correct: boolean };

const TOOL_SLUG = "addition-subtraction-facts";
const ALL_OPS: Op[] = ["add", "sub"];
const TIMED_SECONDS = 60;
const SLOW_MS = 4000;
const MAX_DIGITS = 2;

const RANGES: Record<
  RangeId,
  {
    addendMax: number;
    sumMax: number;
    minuendMax: number;
    subtrahendMax: number;
    chip: string;
    highlight: number[];
  }
> = {
  easy: {
    addendMax: 5,
    sumMax: 10,
    minuendMax: 10,
    subtrahendMax: 5,
    chip: "Easy 0–5 / to 10",
    highlight: [0, 1, 2, 3, 4, 5],
  },
  medium: {
    addendMax: 10,
    sumMax: 10,
    minuendMax: 10,
    subtrahendMax: 10,
    chip: "Medium through 10",
    highlight: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  challenge: {
    addendMax: 12,
    sumMax: 20,
    minuendMax: 20,
    subtrahendMax: 12,
    chip: "Challenge through 20",
    highlight: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
};

const RANGE_ORDER: RangeId[] = ["easy", "medium", "challenge"];

function sameFact(left: Fact, right: Fact) {
  return left.a === right.a && left.b === right.b && left.op === right.op;
}

function factKey(fact: Fact) {
  return `${fact.a}${fact.op === "add" ? "+" : "−"}${fact.b}`;
}

function answerOf(fact: Fact) {
  return fact.op === "add" ? fact.a + fact.b : fact.a - fact.b;
}

function formatFact(fact: Fact) {
  return `${fact.a} ${fact.op === "add" ? "+" : "−"} ${fact.b}`;
}

function buildPool(ops: Op[], range: RangeId): Fact[] {
  const spec = RANGES[range];
  const facts: Fact[] = [];

  if (ops.includes("add")) {
    for (let a = 0; a <= spec.addendMax; a += 1) {
      for (let b = 0; b <= spec.addendMax; b += 1) {
        if (a + b <= spec.sumMax) {
          facts.push({ a, b, op: "add" });
        }
      }
    }
  }

  if (ops.includes("sub")) {
    for (let a = 0; a <= spec.minuendMax; a += 1) {
      for (let b = 0; b <= Math.min(a, spec.subtrahendMax); b += 1) {
        facts.push({ a, b, op: "sub" });
      }
    }
  }

  return facts;
}

function nextFact(
  ops: Op[],
  range: RangeId,
  last: Fact | null,
  focus?: Fact[],
): Fact {
  const pool = focus && focus.length > 0 ? focus : buildPool(ops, range);

  if (pool.length === 0) {
    return { a: 2, b: 3, op: "add" };
  }

  let pick = pool[Math.floor(Math.random() * pool.length)];
  for (let i = 0; i < 8 && last && pool.length > 1; i += 1) {
    if (!sameFact(pick, last)) break;
    pick = pool[Math.floor(Math.random() * pool.length)];
  }
  return pick;
}

function uniqueFacts(facts: Fact[]) {
  const seen = new Set<string>();
  return facts.filter((fact) => {
    const key = factKey(fact);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function AdditionSubtractionFacts() {
  const [ops, setOps] = useState<Op[]>(ALL_OPS);
  const [range, setRange] = useState<RangeId>("easy");
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [showChart, setShowChart] = useState(false);
  const [fact, setFact] = useState<Fact>({ a: 2, b: 3, op: "add" });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [records, setRecords] = useState<FactRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMED_SECONDS);
  const [focusFacts, setFocusFacts] = useState<Fact[] | undefined>(undefined);

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

  const expectedAnswer = answerOf(fact);
  const expected = String(expectedAnswer);

  const stats = useMemo(() => {
    const attempted = records.length;
    const correct = records.filter((item) => item.correct).length;
    const missed = uniqueFacts(records.filter((item) => !item.correct));
    const slow = uniqueFacts(
      records.filter((item) => item.correct && item.ms >= SLOW_MS),
    );
    const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
    return { attempted, correct, missed, slow, accuracy };
  }, [records]);

  const startSession = useCallback(
    (retry?: Fact[]) => {
      trackEvent(analyticsEvents.practiceStart, {
        tool: TOOL_SLUG,
        mode,
      });
      const selected = ops.length > 0 ? ops : ALL_OPS;
      if (ops.length === 0) setOps(ALL_OPS);
      const first = nextFact(selected, range, null, retry);
      setFocusFacts(retry);
      setFact(first);
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
    [mode, ops, range],
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
      const correct = Number(value) === expectedAnswer;
      const ms = Date.now() - shownAtRef.current;
      const record: FactRecord = { ...fact, ms, correct };

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

      const delay = correct ? 900 : 1600;

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
        const upcoming = nextFact(ops, range, fact, focusFacts);
        setFact(upcoming);
        setInput("");
        setFeedback(null);
        shownAtRef.current = Date.now();
        busyRef.current = false;
      }, delay);
    },
    [expectedAnswer, fact, finishSession, focusFacts, mode, ops, range],
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
    if (phase !== "playing") return;

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (busyRef.current) return;
      if (event.key === "Enter") {
        event.preventDefault();
        submitAnswer(input);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setInput((prev) => prev.slice(0, -1));
        return;
      }
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        setInput((prev) =>
          prev.length >= MAX_DIGITS ? prev : `${prev}${event.key}`,
        );
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, phase, submitAnswer]);

  useEffect(() => {
    if (phase !== "playing" || feedback) return;
    if (input.length > 0 && input.length >= expected.length) {
      submitAnswer(input);
    }
  }, [expected.length, feedback, input, phase, submitAnswer]);

  const toggleOp = (op: Op) => {
    setOps((prev) =>
      prev.includes(op) ? prev.filter((item) => item !== op) : [...prev, op],
    );
  };

  const padPress = (value: string) => {
    if (phase !== "playing" || feedback) return;
    if (value === "back") {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if (value === "go") {
      submitAnswer(input);
      return;
    }
    if (input.length >= MAX_DIGITS) return;
    setInput((prev) => `${prev}${value}`);
  };

  const printChart = () => {
    trackEvent(analyticsEvents.printChart, { tool: TOOL_SLUG });
    setShowChart(true);
    window.setTimeout(() => window.print(), 50);
  };

  const retryFacts = uniqueFacts([...stats.missed, ...stats.slow]);

  return (
    <div>
      <div className="no-print snap-panel">
        {phase === "setup" ? (
          <SetupPanel
            ops={ops}
            range={range}
            mode={mode}
            onToggleOp={toggleOp}
            onRange={setRange}
            onMode={setMode}
            onStart={() => startSession()}
          />
        ) : null}

        {phase === "playing" ? (
          <PlayPanel
            mode={mode}
            fact={fact}
            input={input}
            feedback={feedback}
            streak={streak}
            stats={stats}
            timeLeft={timeLeft}
            onPad={padPress}
            onFinish={finishSession}
          />
        ) : null}

        {phase === "results" ? (
          <ResultsPanel
            mode={mode}
            stats={stats}
            bestStreak={bestStreak}
            onAgain={() => startSession(focusFacts)}
            onRetryMissed={
              retryFacts.length > 0 ? () => startSession(retryFacts) : undefined
            }
            onSetup={() => {
              setPhase("setup");
              setFocusFacts(undefined);
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
          Show printable 0–12 chart
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
          <AdditionChart highlightAddends={RANGES[range].highlight} />
        </div>
      ) : null}

      <div className="mt-6 hidden print-only">
        <h2 className="mb-3 font-display text-2xl">Addition chart (0–12)</h2>
        <AdditionChart />
      </div>
    </div>
  );
}

function SetupPanel({
  ops,
  range,
  mode,
  onToggleOp,
  onRange,
  onMode,
  onStart,
}: {
  ops: Op[];
  range: RangeId;
  mode: Mode;
  onToggleOp: (op: Op) => void;
  onRange: (range: RangeId) => void;
  onMode: (mode: Mode) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose operations</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Tap addition, subtraction, or both. Presets set the number range.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-md">
        <OpButton
          label="Addition"
          symbol="+"
          selected={ops.includes("add")}
          onClick={() => onToggleOp("add")}
        />
        <OpButton
          label="Subtraction"
          symbol="−"
          selected={ops.includes("sub")}
          onClick={() => onToggleOp("sub")}
        />
      </div>

      <h3 className="mt-6 font-display text-xl text-ink">Range</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {RANGE_ORDER.map((id) => (
          <PresetButton
            key={id}
            label={RANGES[id].chip}
            active={range === id}
            onClick={() => onRange(id)}
          />
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        {range === "easy"
          ? "Addends 0–5 and sums to 10. Subtrahends 0–5, differences within 10."
          : range === "medium"
            ? "Addends through 10 with sums to 10. Differences within 10."
            : "Addends through 12. Sums and differences through 20."}
      </p>

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
        disabled={ops.length === 0}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-50 sm:w-auto"
      >
        Start
      </button>
    </div>
  );
}

function PlayPanel({
  mode,
  fact,
  input,
  feedback,
  streak,
  stats,
  timeLeft,
  onPad,
  onFinish,
}: {
  mode: Mode;
  fact: Fact;
  input: string;
  feedback: "correct" | "wrong" | null;
  streak: number;
  stats: { attempted: number; correct: number; accuracy: number };
  timeLeft: number;
  onPad: (value: string) => void;
  onFinish: () => void;
}) {
  const answer = answerOf(fact);
  const prompt = formatFact(fact);

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

      <div
        className={`mt-6 rounded-2xl border px-4 py-8 text-center sm:px-6 ${
          feedback === "correct"
            ? "animate-pop border-ok bg-ok-soft"
            : feedback === "wrong"
              ? "animate-shake border-bad bg-bad-soft"
              : "border-line bg-bg"
        }`}
        aria-live="polite"
      >
        <p className="font-display text-4xl tabular-nums tracking-wide text-ink sm:text-5xl">
          {prompt} ={" "}
          <span className="inline-block min-w-[3ch] border-b-2 border-ink/40">
            {input || "?"}
          </span>
        </p>
        <p
          className={`mt-3 min-h-6 text-sm font-semibold ${
            feedback === "correct"
              ? "text-ok"
              : feedback === "wrong"
                ? "text-bad"
                : "font-medium text-ink-muted"
          }`}
        >
          {feedback === "correct"
            ? `Yes! ${prompt} = ${answer}`
            : feedback === "wrong"
              ? `Not quite. ${prompt} = ${answer}`
              : "Use the pad or your keyboard"}
        </p>
      </div>

      <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "go"].map(
          (key) => (
            <button
              key={key}
              type="button"
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
    missed: Fact[];
    slow: Fact[];
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
            ? "Streak ended on a miss — those are the facts to keep."
            : "Here’s what this round looked like."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Correct" value={`${stats.correct}`} />
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Best streak" value={`${bestStreak}`} />
        <Stat label="Tried" value={`${stats.attempted}`} />
      </div>

      <FactList
        title="Missed facts"
        empty="No misses. That’s the goal."
        facts={stats.missed}
      />
      <FactList
        title="Slow facts (4+ seconds)"
        empty="No slow facts this round."
        facts={stats.slow}
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
          Change setup
        </button>
      </div>
    </div>
  );
}

function FactList({
  title,
  empty,
  facts,
}: {
  title: string;
  empty: string;
  facts: Fact[];
}) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {facts.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {facts.map((fact) => (
            <li
              key={factKey(fact)}
              className="rounded-lg border border-line bg-bg px-2.5 py-1 text-sm tabular-nums"
            >
              {formatFact(fact)} = {answerOf(fact)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function OpButton({
  label,
  symbol,
  selected,
  onClick,
}: {
  label: string;
  symbol: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-14 rounded-xl border text-base font-semibold ${
        selected
          ? "border-accent bg-accent text-accent-ink"
          : "border-line bg-bg text-ink hover:border-accent/50"
      }`}
    >
      <span className="mr-2 font-display text-xl">{symbol}</span>
      {label}
    </button>
  );
}

function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-full px-3 text-sm font-medium ${
        active
          ? "bg-accent text-accent-ink"
          : "border border-line bg-bg text-ink hover:border-accent/50"
      }`}
    >
      {label}
    </button>
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
