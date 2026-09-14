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
type Difficulty = "easy" | "medium" | "hard" | "challenge";
type TokenKind = "penny" | "nickel" | "dime" | "quarter" | "dollar" | "five";

type MoneyToken = {
  kind: TokenKind;
};

type IdentifyProblem = {
  kind: "identify";
  token: MoneyToken;
  answerCents: number;
};

type CountProblem = {
  kind: "count";
  tokens: MoneyToken[];
  answerCents: number;
};

type ChangeProblem = {
  kind: "change";
  item: string;
  priceCents: number;
  paidCents: number;
  tokens: MoneyToken[];
  answerCents: number;
};

type Problem = IdentifyProblem | CountProblem | ChangeProblem;
type MoneyRecord = { problem: Problem; ms: number; correct: boolean };

const TIMED_SECONDS = 60;
const SLOW_MS = 4000;
const TOOL_SLUG = "counting-money";

const DIFFICULTIES: {
  id: Difficulty;
  title: string;
  detail: string;
}[] = [
  {
    id: "easy",
    title: "Easy",
    detail: "Name a coin, or count a pile of the same coins.",
  },
  {
    id: "medium",
    title: "Medium",
    detail: "Mixed pennies, nickels, dimes, and quarters.",
  },
  {
    id: "hard",
    title: "Hard",
    detail: "Mixed coins plus $1 and $5 bills.",
  },
  {
    id: "challenge",
    title: "Challenge",
    detail: "Make change — price plus what was paid.",
  },
];

const KIND_ORDER: TokenKind[] = [
  "five",
  "dollar",
  "quarter",
  "dime",
  "nickel",
  "penny",
];

const DENOMS: Record<
  TokenKind,
  {
    cents: number;
    name: string;
    plural: string;
    valueLabel: string;
  }
> = {
  penny: { cents: 1, name: "penny", plural: "pennies", valueLabel: "1¢" },
  nickel: { cents: 5, name: "nickel", plural: "nickels", valueLabel: "5¢" },
  dime: { cents: 10, name: "dime", plural: "dimes", valueLabel: "10¢" },
  quarter: { cents: 25, name: "quarter", plural: "quarters", valueLabel: "25¢" },
  dollar: {
    cents: 100,
    name: "one-dollar bill",
    plural: "one-dollar bills",
    valueLabel: "$1",
  },
  five: {
    cents: 500,
    name: "five-dollar bill",
    plural: "five-dollar bills",
    valueLabel: "$5",
  },
};

const COIN_KINDS: TokenKind[] = ["penny", "nickel", "dime", "quarter"];

const STORE_ITEMS = [
  "an apple",
  "a pencil",
  "a sticker pack",
  "a notebook",
  "juice",
  "an eraser",
  "a bookmark",
  "crayons",
  "a ruler",
  "a folder",
  "a muffin",
  "a yo-yo",
];

function pickFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function tokenCents(token: MoneyToken) {
  return DENOMS[token.kind].cents;
}

function sumTokens(tokens: MoneyToken[]) {
  return tokens.reduce((total, token) => total + tokenCents(token), 0);
}

function sortTokens(tokens: MoneyToken[]) {
  return [...tokens].sort(
    (left, right) =>
      KIND_ORDER.indexOf(left.kind) - KIND_ORDER.indexOf(right.kind),
  );
}

function tokensOf(kind: TokenKind, count: number): MoneyToken[] {
  return Array.from({ length: count }, () => ({ kind }));
}

function formatMoney(cents: number) {
  if (cents < 100) return `${cents}¢`;
  return `$${(cents / 100).toFixed(2)}`;
}

function countByKind(tokens: MoneyToken[]) {
  const counts = {} as Record<TokenKind, number>;
  for (const token of tokens) {
    counts[token.kind] = (counts[token.kind] ?? 0) + 1;
  }
  return counts;
}

function describeTokens(tokens: MoneyToken[]) {
  const counts = countByKind(tokens);
  const parts: string[] = [];
  for (const kind of KIND_ORDER) {
    const count = counts[kind];
    if (!count) continue;
    const denom = DENOMS[kind];
    parts.push(`${count} ${count === 1 ? denom.name : denom.plural}`);
  }
  if (parts.length === 0) return "no money";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function problemKey(problem: Problem) {
  if (problem.kind === "identify") return `identify:${problem.token.kind}`;
  if (problem.kind === "count") {
    return `count:${problem.tokens.map((token) => token.kind).join(",")}`;
  }
  return `change:${problem.item}:${problem.priceCents}:${problem.paidCents}`;
}

function sameProblem(left: Problem, right: Problem) {
  return problemKey(left) === problemKey(right);
}

function summarizeProblem(problem: Problem) {
  if (problem.kind === "identify") {
    const denom = DENOMS[problem.token.kind];
    return `${capitalize(denom.name)} → ${formatMoney(problem.answerCents)}`;
  }
  if (problem.kind === "count") {
    return `${describeTokens(problem.tokens)} → ${formatMoney(problem.answerCents)}`;
  }
  return `Change for ${problem.item} (${formatMoney(problem.priceCents)}), paid ${formatMoney(problem.paidCents)} → ${formatMoney(problem.answerCents)}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

function tokensForAmount(cents: number): MoneyToken[] {
  let remaining = cents;
  const tokens: MoneyToken[] = [];
  const fives = Math.floor(remaining / 500);
  remaining -= fives * 500;
  tokens.push(...tokensOf("five", fives));
  const ones = Math.floor(remaining / 100);
  remaining -= ones * 100;
  tokens.push(...tokensOf("dollar", ones));
  const quarters = Math.floor(remaining / 25);
  remaining -= quarters * 25;
  tokens.push(...tokensOf("quarter", quarters));
  const dimes = Math.floor(remaining / 10);
  remaining -= dimes * 10;
  tokens.push(...tokensOf("dime", dimes));
  const nickels = Math.floor(remaining / 5);
  remaining -= nickels * 5;
  tokens.push(...tokensOf("nickel", nickels));
  tokens.push(...tokensOf("penny", remaining));
  return sortTokens(tokens);
}

function mixedCoins(maxCoins: number, minCoins: number) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const quarters = randomInt(0, 4);
    const dimes = randomInt(0, 4);
    const nickels = randomInt(0, 3);
    const pennies = randomInt(0, 6);
    const tokens = sortTokens([
      ...tokensOf("quarter", quarters),
      ...tokensOf("dime", dimes),
      ...tokensOf("nickel", nickels),
      ...tokensOf("penny", pennies),
    ]);
    const kinds = new Set(tokens.map((token) => token.kind)).size;
    if (
      tokens.length >= minCoins &&
      tokens.length <= maxCoins &&
      kinds >= 2 &&
      sumTokens(tokens) > 0
    ) {
      return tokens;
    }
  }
  return sortTokens([
    ...tokensOf("quarter", 2),
    ...tokensOf("dime", 1),
    ...tokensOf("nickel", 1),
    ...tokensOf("penny", 2),
  ]);
}

function hardMoney() {
  const fives = randomInt(0, 1);
  const ones = randomInt(fives === 0 ? 1 : 0, fives === 1 ? 2 : 3);
  const coins = mixedCoins(6, 2);
  return sortTokens([
    ...tokensOf("five", fives),
    ...tokensOf("dollar", ones),
    ...coins,
  ]);
}

function makeIdentify(kind: TokenKind): IdentifyProblem {
  return {
    kind: "identify",
    token: { kind },
    answerCents: DENOMS[kind].cents,
  };
}

function makeCount(tokens: MoneyToken[]): CountProblem {
  const sorted = sortTokens(tokens);
  return {
    kind: "count",
    tokens: sorted,
    answerCents: sumTokens(sorted),
  };
}

function makeChangeProblem(): ChangeProblem {
  const item = pickFrom(STORE_ITEMS);
  const priceCents = pickFrom([
    randomInt(12, 99),
    randomInt(35, 185),
    randomInt(108, 449),
    randomInt(215, 799),
  ]);

  const nextDollar = Math.ceil(priceCents / 100) * 100;
  const paymentChoices = [nextDollar, 100, 500, 1000].filter(
    (paid) => paid > priceCents,
  );
  if (priceCents < 75) {
    const coinPay = pickFrom([50, 75, 100]);
    if (coinPay > priceCents) paymentChoices.push(coinPay);
  }
  const paidCents = pickFrom(paymentChoices);
  const tokens = tokensForAmount(paidCents);

  return {
    kind: "change",
    item,
    priceCents,
    paidCents,
    tokens,
    answerCents: paidCents - priceCents,
  };
}

function generateProblem(difficulty: Difficulty): Problem {
  if (difficulty === "easy") {
    if (Math.random() < 0.45) {
      return makeIdentify(pickFrom(COIN_KINDS));
    }
    const kind = pickFrom(COIN_KINDS);
    const max = kind === "quarter" || kind === "nickel" ? 6 : 8;
    return makeCount(tokensOf(kind, randomInt(2, max)));
  }
  if (difficulty === "medium") {
    return makeCount(mixedCoins(8, 3));
  }
  if (difficulty === "hard") {
    return makeCount(hardMoney());
  }
  return makeChangeProblem();
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

/** Accept cents (25, 25¢), dollars ($0.25, 0.25), or an unmarked integer as either. */
function parseMoneyCandidates(raw: string): number[] {
  const trimmed = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!trimmed) return [];

  const hasDollar = trimmed.includes("$");
  const hasCentMark = /¢|cents?/.test(trimmed);
  const cleaned = trimmed
    .replace(/[$,¢]/g, "")
    .replace(/cents?/g, "")
    .replace(/dollars?/g, "");
  if (!cleaned) return [];

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return [];

  if (hasDollar && !hasCentMark) {
    return [Math.round(value * 100)];
  }
  if (hasCentMark && !hasDollar) {
    return [Math.round(value)];
  }
  if (trimmed.includes(".")) {
    return [Math.round(value * 100)];
  }
  const asCents = Math.round(value);
  const asDollars = Math.round(value * 100);
  return asCents === asDollars ? [asCents] : [asCents, asDollars];
}

function matchesAmount(raw: string, answerCents: number) {
  return parseMoneyCandidates(raw).includes(answerCents);
}

function promptFor(problem: Problem) {
  if (problem.kind === "identify") {
    return "How much is this coin worth?";
  }
  if (problem.kind === "count") {
    return "How much money is this?";
  }
  return `How much change do you get?`;
}

export function CountingMoney() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [problem, setProblem] = useState<Problem>(() => makeIdentify("quarter"));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [records, setRecords] = useState<MoneyRecord[]>([]);
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

  const expected = formatMoney(problem.answerCents);

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
      const correct = matchesAmount(value, problem.answerCents);
      const ms = Date.now() - shownAtRef.current;
      const record: MoneyRecord = { problem, ms, correct };

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
    setInput((prev) => (prev.length >= 8 ? prev : `${prev}${value}`));
    focusInput();
  };

  const retryProblems = uniqueProblems([...stats.missed, ...stats.slow]);

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
        Start with one coin or a same-coin pile. Mix coins next, then add bills.
        Challenge is making change.
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
  const showValues = problem.kind !== "identify" || Boolean(feedback);

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
            : promptFor(problem)}
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
        <ProblemVisual problem={problem} showValues={showValues} />
        {feedback ? (
          <p className="mt-4 font-display text-3xl tabular-nums text-ink">
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
        <label className="block text-sm font-semibold text-ink" htmlFor="money-answer">
          {problem.kind === "change" ? "Change owed" : "Total"}
        </label>
        <input
          id="money-answer"
          ref={inputRef}
          value={input}
          onChange={(event) => onInput(event.target.value.slice(0, 8))}
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={Boolean(feedback)}
          placeholder="25 or $0.25"
          aria-describedby="money-answer-hint"
          className="mt-2 min-h-12 w-full rounded-xl border-2 border-line bg-bg px-3 text-center font-display text-2xl tabular-nums text-ink outline-none focus:border-secondary sm:text-3xl"
        />
        <p id="money-answer-hint" className="mt-2 text-sm text-ink-muted">
          Type cents (25) or dollars ($0.25). Press Enter to check.
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
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
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
          onClick={() => onPad("$")}
          className="min-h-14 touch-manipulation rounded-xl border border-line bg-bg text-lg font-semibold text-ink hover:border-accent/50"
        >
          $
        </button>
        <button
          type="button"
          onClick={() => onPad("go")}
          className="col-span-2 min-h-14 touch-manipulation rounded-xl bg-accent text-lg font-semibold text-accent-ink"
        >
          OK
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
              className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm"
            >
              {summarizeProblem(problem)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProblemVisual({
  problem,
  showValues,
}: {
  problem: Problem;
  showValues: boolean;
}) {
  if (problem.kind === "identify") {
    return (
      <div className="flex justify-center">
        <MoneyTokenView token={problem.token} showValue={showValues} large />
      </div>
    );
  }

  if (problem.kind === "count") {
    return (
      <TokenTray
        tokens={problem.tokens}
        showValues={showValues}
        label={`Money to count: ${describeTokens(problem.tokens)}`}
      />
    );
  }

  return (
    <div>
      <p className="font-display text-xl text-ink sm:text-2xl">
        {capitalize(problem.item)} costs{" "}
        <span className="tabular-nums">{formatMoney(problem.priceCents)}</span>
      </p>
      <p className="mt-2 text-sm font-semibold text-ink-muted">You pay with</p>
      <div className="mt-3">
        <TokenTray
          tokens={problem.tokens}
          showValues
          label={`Payment: ${describeTokens(problem.tokens)}, ${formatMoney(problem.paidCents)}`}
        />
      </div>
    </div>
  );
}

function TokenTray({
  tokens,
  showValues,
  label,
}: {
  tokens: MoneyToken[];
  showValues: boolean;
  label: string;
}) {
  return (
    <ul
      className="flex flex-wrap items-end justify-center gap-3 sm:gap-4"
      aria-label={label}
    >
      {tokens.map((token, index) => (
        <li key={`${token.kind}-${index}`}>
          <MoneyTokenView token={token} showValue={showValues} />
        </li>
      ))}
    </ul>
  );
}

function MoneyTokenView({
  token,
  showValue,
  large = false,
}: {
  token: MoneyToken;
  showValue: boolean;
  large?: boolean;
}) {
  const denom = DENOMS[token.kind];
  const valueText = showValue ? `, ${denom.valueLabel}` : "";
  const label = `${capitalize(denom.name)}${valueText}`;

  if (token.kind === "dollar" || token.kind === "five") {
    return (
      <BillToken
        kind={token.kind}
        showValue={showValue}
        large={large}
        label={label}
      />
    );
  }

  return (
    <CoinToken
      kind={token.kind}
      showValue={showValue}
      large={large}
      label={label}
    />
  );
}

function CoinToken({
  kind,
  showValue,
  large,
  label,
}: {
  kind: "penny" | "nickel" | "dime" | "quarter";
  showValue: boolean;
  large: boolean;
  label: string;
}) {
  const size = large
    ? kind === "dime"
      ? 104
      : kind === "penny"
        ? 116
        : kind === "nickel"
          ? 124
          : 136
    : kind === "dime"
      ? 72
      : kind === "penny"
        ? 80
        : kind === "nickel"
          ? 88
          : 96;

  const palette = {
    penny: { fill: "#c45c26", rim: "#8a3b14", text: "#2a1208" },
    nickel: { fill: "#c5ccd4", rim: "#7d8691", text: "#1a1d22" },
    dime: { fill: "#d7dde4", rim: "#8b949e", text: "#1a1d22" },
    quarter: { fill: "#e8d7a3", rim: "#b0892e", text: "#2a2410" },
  }[kind];

  const denom = DENOMS[kind];

  return (
    <figure className="m-0 flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        role="img"
        aria-label={label}
      >
        <circle cx="40" cy="40" r="38" fill={palette.rim} />
        <circle cx="40" cy="40" r="32" fill={palette.fill} />
        <circle
          cx="40"
          cy="40"
          r="28"
          fill="none"
          stroke={palette.rim}
          strokeWidth="1.5"
          strokeDasharray="3 4"
          opacity="0.7"
        />
        <text
          x="40"
          y="45"
          textAnchor="middle"
          fill={palette.text}
          fontSize={showValue ? 20 : 12}
          fontWeight="800"
        >
          {showValue ? denom.valueLabel : capitalize(denom.name)}
        </text>
      </svg>
      <figcaption className="text-xs font-semibold text-ink">
        {capitalize(denom.name)}
      </figcaption>
    </figure>
  );
}

function BillToken({
  kind,
  showValue,
  large,
  label,
}: {
  kind: "dollar" | "five";
  showValue: boolean;
  large: boolean;
  label: string;
}) {
  const width = large ? 168 : 132;
  const height = large ? 84 : 66;
  const palette =
    kind === "dollar"
      ? { fill: "#2f9e5a", rim: "#16653a", text: "#f4fff6" }
      : { fill: "#156b8a", rim: "#0c4660", text: "#f4fbff" };
  const denom = DENOMS[kind];

  return (
    <figure className="m-0 flex flex-col items-center gap-1">
      <svg
        width={width}
        height={height}
        viewBox="0 0 140 68"
        role="img"
        aria-label={label}
      >
        <rect
          x="2"
          y="2"
          width="136"
          height="64"
          rx="8"
          fill={palette.rim}
        />
        <rect
          x="8"
          y="8"
          width="124"
          height="52"
          rx="5"
          fill={palette.fill}
        />
        <rect
          x="14"
          y="14"
          width="112"
          height="40"
          rx="3"
          fill="none"
          stroke={palette.text}
          strokeWidth="1.4"
          opacity="0.35"
        />
        <text
          x="70"
          y="40"
          textAnchor="middle"
          fill={palette.text}
          fontSize={showValue ? 24 : 14}
          fontWeight="800"
        >
          {showValue ? denom.valueLabel : kind === "dollar" ? "ONE" : "FIVE"}
        </text>
      </svg>
      <figcaption className="text-xs font-semibold text-ink">
        {capitalize(denom.name)}
      </figcaption>
    </figure>
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
