"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DivisionChart } from "@/components/tools/DivisionChart";

type Mode = "practice" | "timed" | "streak";
type Phase = "setup" | "playing" | "results";
type Fact = { dividend: number; divisor: number };
type FactRecord = Fact & { ms: number; correct: boolean };

const ALL_DIVISORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const ALL_QUOTIENTS = ALL_DIVISORS;
const EASY = [1, 2, 5, 10];
const HARD = [6, 7, 8, 9, 12];
const TIMED_SECONDS = 60;
const SLOW_MS = 4000;

function sameFact(left: Fact, right: Fact) {
  return left.dividend === right.dividend && left.divisor === right.divisor;
}

function factKey(fact: Fact) {
  return `${fact.dividend}÷${fact.divisor}`;
}

function quotientOf(fact: Fact) {
  return fact.dividend / fact.divisor;
}

function nextFact(divisors: number[], last: Fact | null, focus?: Fact[]): Fact {
  const pool =
    focus && focus.length > 0
      ? focus
      : divisors.flatMap((divisor) =>
          ALL_QUOTIENTS.map((quotient) => ({
            dividend: divisor * quotient,
            divisor,
          })),
        );

  if (pool.length === 0) {
    return { dividend: 10, divisor: 2 };
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

export function DivisionFacts() {
  const [divisors, setDivisors] = useState<number[]>(EASY);
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [showChart, setShowChart] = useState(false);
  const [fact, setFact] = useState<Fact>({ dividend: 10, divisor: 2 });
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

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const quotient = quotientOf(fact);
  const expected = String(quotient);

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
      const selected = divisors.length > 0 ? divisors : EASY;
      if (divisors.length === 0) setDivisors(EASY);
      const first = nextFact(selected, null, retry);
      setFocusFacts(retry);
      setFact(first);
      setInput("");
      setFeedback(null);
      setRecords([]);
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
    [divisors],
  );

  const finishSession = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    setPhase("results");
    setFeedback(null);
  }, []);

  const submitAnswer = useCallback(
    (raw: string) => {
      if (phaseRef.current !== "playing" || busyRef.current) return;
      const value = raw.trim();
      if (value.length === 0) return;

      busyRef.current = true;
      const correct = Number(value) === quotient;
      const ms = Date.now() - shownAtRef.current;
      const record: FactRecord = { ...fact, ms, correct };

      setRecords((prev) => [...prev, record]);
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
        const upcoming = nextFact(divisors, fact, focusFacts);
        setFact(upcoming);
        setInput("");
        setFeedback(null);
        shownAtRef.current = Date.now();
        busyRef.current = false;
      }, delay);
    },
    [divisors, fact, finishSession, focusFacts, mode, quotient],
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
        setInput((prev) => (prev.length >= 2 ? prev : `${prev}${event.key}`));
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

  const toggleDivisor = (n: number) => {
    setDivisors((prev) =>
      prev.includes(n) ? prev.filter((item) => item !== n) : [...prev, n].sort((a, b) => a - b),
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
    if (input.length >= 2) return;
    setInput((prev) => `${prev}${value}`);
  };

  const printChart = () => {
    setShowChart(true);
    window.setTimeout(() => window.print(), 50);
  };

  const retryFacts = uniqueFacts([...stats.missed, ...stats.slow]);

  return (
    <div>
      <div className="no-print rounded-2xl border border-line bg-surface p-4 snap-shadow sm:p-6">
        {phase === "setup" ? (
          <SetupPanel
            divisors={divisors}
            mode={mode}
            onToggleDivisor={toggleDivisor}
            onPreset={setDivisors}
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
          Show printable 1–12 chart
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
          <DivisionChart highlightDivisors={divisors} />
        </div>
      ) : null}

      <div className="mt-6 hidden print-only">
        <h2 className="mb-3 font-display text-2xl">Division chart (1–12)</h2>
        <DivisionChart />
      </div>
    </div>
  );
}

function SetupPanel({
  divisors,
  mode,
  onToggleDivisor,
  onPreset,
  onMode,
  onStart,
}: {
  divisors: number[];
  mode: Mode;
  onToggleDivisor: (n: number) => void;
  onPreset: (divisors: number[]) => void;
  onMode: (mode: Mode) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose divisors</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Tap the divisors you want. Presets get you started in one tap. Every
        problem is an exact fact — no remainders.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <PresetButton
          label="Easy 1 / 2 / 5 / 10"
          active={sameSet(divisors, EASY)}
          onClick={() => onPreset(EASY)}
        />
        <PresetButton
          label="Hard 6 / 7 / 8 / 9 / 12"
          active={sameSet(divisors, HARD)}
          onClick={() => onPreset(HARD)}
        />
        <PresetButton
          label="All 1–12"
          active={sameSet(divisors, ALL_DIVISORS)}
          onClick={() => onPreset(ALL_DIVISORS)}
        />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {ALL_DIVISORS.map((n) => {
          const selected = divisors.includes(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onToggleDivisor(n)}
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
        disabled={divisors.length === 0}
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
  const quotient = quotientOf(fact);

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
          {fact.dividend} ÷ {fact.divisor} ={" "}
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
            ? `Yes! ${fact.dividend} ÷ ${fact.divisor} = ${quotient}`
            : feedback === "wrong"
              ? `Not quite. ${fact.dividend} ÷ ${fact.divisor} = ${quotient}`
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
          Change divisors
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
              {fact.dividend} ÷ {fact.divisor} = {quotientOf(fact)}
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

function sameSet(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  return left.every((n, index) => n === right[index]);
}
