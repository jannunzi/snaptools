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
import {
  CENSUS_REGIONS,
  acceptedAnswers,
  guessMatches,
  pickOptions,
  shuffle,
  statesInRegion,
  type QuizDirection,
  type RegionFilter,
  type USState,
} from "@/lib/states-capitals";

const TOOL_SLUG = "states-and-capitals";

type DirectionMode = QuizDirection | "mixed";
type AnswerStyle = "choice" | "type";
type LengthMode = "quick" | "full" | "streak";
type Phase = "setup" | "playing" | "results";
type Feedback = "correct" | "wrong" | null;

type AskItem = {
  state: USState;
  direction: QuizDirection;
  options: string[];
};

type Miss = {
  key: string;
  prompt: string;
  answer: string;
};

function promptOf(item: AskItem) {
  return item.direction === "capital"
    ? `What is the capital of ${item.state.name}?`
    : `Which state has the capital ${item.state.capital}?`;
}

function officialAnswer(item: AskItem) {
  return item.direction === "capital" ? item.state.capital : item.state.name;
}

function buildAsk(state: USState, direction: QuizDirection, pool: USState[]): AskItem {
  return {
    state,
    direction,
    options: pickOptions(state, pool, direction),
  };
}

function pickDirection(mode: DirectionMode): QuizDirection {
  if (mode === "mixed") return Math.random() < 0.5 ? "capital" : "state";
  return mode;
}

function deal(pool: USState[], direction: DirectionMode, length: LengthMode): AskItem[] {
  const shuffled = shuffle(pool);
  const count =
    length === "quick" ? Math.min(10, shuffled.length) : shuffled.length;
  return shuffled.slice(0, count).map((state) =>
    buildAsk(state, pickDirection(direction), pool),
  );
}

function nextAsk(
  pool: USState[],
  direction: DirectionMode,
  last: AskItem | null,
): AskItem {
  if (pool.length === 0) {
    const fallback = statesInRegion("all")[0];
    return buildAsk(fallback, pickDirection(direction), statesInRegion("all"));
  }
  let pick = pool[Math.floor(Math.random() * pool.length)];
  for (let i = 0; i < 8 && last && pool.length > 1; i += 1) {
    if (pick.abbr !== last.state.abbr) break;
    pick = pool[Math.floor(Math.random() * pool.length)];
  }
  return buildAsk(pick, pickDirection(direction), pool);
}

export function StatesAndCapitals() {
  const [direction, setDirection] = useState<DirectionMode>("capital");
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>("choice");
  const [length, setLength] = useState<LengthMode>("quick");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [showAbbr, setShowAbbr] = useState(false);

  const [phase, setPhase] = useState<Phase>("setup");
  const [deck, setDeck] = useState<AskItem[]>([]);
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<AskItem | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const phaseRef = useRef(phase);
  const endingRef = useRef(false);
  const busyRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const scoreRef = useRef({ correct: 0, wrong: 0 });

  const pool = useMemo(() => statesInRegion(region), [region]);
  const fullCount = pool.length;

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => () => clearAdvanceTimer(), []);

  useEffect(() => {
    if (phase !== "playing" || answerStyle !== "type" || feedback) return;
    inputRef.current?.focus();
  }, [answerStyle, current, feedback, phase]);

  const startSession = useCallback(() => {
    const selected = pool.length > 0 ? pool : statesInRegion("all");
    trackEvent(analyticsEvents.practiceStart, {
      tool: TOOL_SLUG,
      mode: `${length}-${direction}`,
    });
    endingRef.current = false;
    busyRef.current = false;
    clearAdvanceTimer();
    scoreRef.current = { correct: 0, wrong: 0 };
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setBestStreak(0);
    setMisses([]);
    setInput("");
    setFeedback(null);
    setIndex(0);

    if (length === "streak") {
      const first = nextAsk(selected, direction, null);
      setDeck([]);
      setCurrent(first);
    } else {
      const nextDeck = deal(selected, direction, length);
      setDeck(nextDeck);
      setCurrent(nextDeck[0] ?? null);
    }
    setPhase("playing");
  }, [direction, length, pool]);

  const finishSession = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    clearAdvanceTimer();
    const { correct, wrong } = scoreRef.current;
    trackEvent(analyticsEvents.practiceFinish, {
      tool: TOOL_SLUG,
      mode: `${length}-${direction}`,
      score: correct,
      count: correct + wrong,
    });
    setPhase("results");
    setFeedback(null);
  }, [direction, length]);

  const goNext = useCallback(
    (wasCorrect: boolean) => {
      if (length === "streak") {
        if (!wasCorrect) {
          finishSession();
          return;
        }
        const selected = pool.length > 0 ? pool : statesInRegion("all");
        const upcoming = nextAsk(selected, direction, current);
        setCurrent(upcoming);
        setIndex((prev) => prev + 1);
        setInput("");
        setFeedback(null);
        busyRef.current = false;
        return;
      }

      const nextIndex = index + 1;
      if (nextIndex >= deck.length) {
        finishSession();
        return;
      }
      setIndex(nextIndex);
      setCurrent(deck[nextIndex] ?? null);
      setInput("");
      setFeedback(null);
      busyRef.current = false;
    },
    [current, deck, direction, finishSession, index, length, pool],
  );

  const grade = useCallback(
    (raw: string) => {
      if (!current || phaseRef.current !== "playing" || busyRef.current) return;
      const value = raw.trim();
      if (value.length === 0) return;

      busyRef.current = true;
      setInput(value);
      const accepted = acceptedAnswers(current.state, current.direction);
      const ok = guessMatches(value, accepted);
      setFeedback(ok ? "correct" : "wrong");

      if (ok) {
        scoreRef.current = {
          correct: scoreRef.current.correct + 1,
          wrong: scoreRef.current.wrong,
        };
        setCorrectCount((prev) => prev + 1);
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((best) => Math.max(best, next));
          return next;
        });
      } else {
        scoreRef.current = {
          correct: scoreRef.current.correct,
          wrong: scoreRef.current.wrong + 1,
        };
        setWrongCount((prev) => prev + 1);
        setStreak(0);
        setMisses((prev) => {
          const key = `${current.state.abbr}-${current.direction}`;
          if (prev.some((item) => item.key === key)) return prev;
          return [
            ...prev,
            {
              key,
              prompt: `${current.state.name} — ${current.state.capital}`,
              answer: officialAnswer(current),
            },
          ];
        });
      }

      const delay = ok ? 900 : 1600;
      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => {
        if (endingRef.current || phaseRef.current !== "playing") {
          busyRef.current = false;
          return;
        }
        goNext(ok);
      }, delay);
    },
    [current, goNext],
  );

  const attempted = correctCount + wrongCount;
  const accuracy =
    attempted === 0 ? 0 : Math.round((correctCount / attempted) * 100);
  const totalLabel =
    length === "streak" ? "∞" : String(deck.length || (length === "quick" ? Math.min(10, fullCount) : fullCount));

  return (
    <div className="snap-panel">
      {phase === "setup" ? (
        <SetupPanel
          direction={direction}
          answerStyle={answerStyle}
          length={length}
          region={region}
          showAbbr={showAbbr}
          fullCount={fullCount}
          onDirection={setDirection}
          onAnswerStyle={setAnswerStyle}
          onLength={setLength}
          onRegion={setRegion}
          onShowAbbr={setShowAbbr}
          onStart={startSession}
        />
      ) : null}

      {phase === "playing" && current ? (
        <PlayPanel
          current={current}
          answerStyle={answerStyle}
          length={length}
          showAbbr={showAbbr}
          index={index}
          totalLabel={totalLabel}
          correctCount={correctCount}
          streak={streak}
          accuracy={accuracy}
          attempted={attempted}
          input={input}
          feedback={feedback}
          inputRef={inputRef}
          onInput={setInput}
          onGrade={grade}
          onFinish={finishSession}
        />
      ) : null}

      {phase === "results" ? (
        <ResultsPanel
          length={length}
          correctCount={correctCount}
          wrongCount={wrongCount}
          accuracy={accuracy}
          bestStreak={bestStreak}
          misses={misses}
          onAgain={startSession}
          onSetup={() => {
            setPhase("setup");
            setCurrent(null);
            setFeedback(null);
            busyRef.current = false;
            endingRef.current = false;
          }}
        />
      ) : null}
    </div>
  );
}

function SetupPanel({
  direction,
  answerStyle,
  length,
  region,
  showAbbr,
  fullCount,
  onDirection,
  onAnswerStyle,
  onLength,
  onRegion,
  onShowAbbr,
  onStart,
}: {
  direction: DirectionMode;
  answerStyle: AnswerStyle;
  length: LengthMode;
  region: RegionFilter;
  showAbbr: boolean;
  fullCount: number;
  onDirection: (value: DirectionMode) => void;
  onAnswerStyle: (value: AnswerStyle) => void;
  onLength: (value: LengthMode) => void;
  onRegion: (value: RegionFilter) => void;
  onShowAbbr: (value: boolean) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose a quiz</h2>
      <p className="mt-1 text-sm text-ink-muted">
        All 50 official state capitals. Filter by Census region if you want a
        smaller set.
      </p>

      <h3 className="mt-6 font-display text-xl text-ink">Direction</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ModeButton
          title="Capital from state"
          detail="See the state. Name the capital."
          active={direction === "capital"}
          onClick={() => onDirection("capital")}
        />
        <ModeButton
          title="State from capital"
          detail="See the capital. Name the state."
          active={direction === "state"}
          onClick={() => onDirection("state")}
        />
        <ModeButton
          title="Mixed"
          detail="Both directions, shuffled."
          active={direction === "mixed"}
          onClick={() => onDirection("mixed")}
        />
      </div>

      <h3 className="mt-6 font-display text-xl text-ink">Answer style</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ModeButton
          title="Multiple choice"
          detail="Four options. Tap to answer."
          active={answerStyle === "choice"}
          onClick={() => onAnswerStyle("choice")}
        />
        <ModeButton
          title="Type the answer"
          detail="Case and spaces do not matter."
          active={answerStyle === "type"}
          onClick={() => onAnswerStyle("type")}
        />
      </div>

      <h3 className="mt-6 font-display text-xl text-ink">Length</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ModeButton
          title="Quick 10"
          detail={
            fullCount < 10
              ? `All ${fullCount} in this region.`
              : "Ten random states."
          }
          active={length === "quick"}
          onClick={() => onLength("quick")}
        />
        <ModeButton
          title="Full 50"
          detail={
            region === "all"
              ? "Every state, shuffled."
              : `All ${fullCount} in this region.`
          }
          active={length === "full"}
          onClick={() => onLength("full")}
        />
        <ModeButton
          title="Streak"
          detail="Keep going until the first miss."
          active={length === "streak"}
          onClick={() => onLength("streak")}
        />
      </div>

      <h3 className="mt-6 font-display text-xl text-ink">Region</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {CENSUS_REGIONS.map((item) => {
          const selected = region === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onRegion(item.id)}
              aria-pressed={selected}
              className={`min-h-10 rounded-full px-3 text-sm font-medium ${
                selected
                  ? "bg-accent text-accent-ink"
                  : "border border-line bg-bg text-ink hover:border-accent/50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <label className="mt-5 flex min-h-11 items-start gap-3 rounded-xl border border-line bg-bg px-3 py-3 text-sm text-ink">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--accent)]"
          checked={showAbbr}
          onChange={(event) => onShowAbbr(event.target.checked)}
        />
        <span>
          <span className="font-semibold">Show postal abbreviation</span>
          <span className="mt-0.5 block text-ink-muted">
            A small two-letter hint on capital-from-state questions only — it
            would give away the state otherwise.
          </span>
        </span>
      </label>

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
  current,
  answerStyle,
  length,
  showAbbr,
  index,
  totalLabel,
  correctCount,
  streak,
  accuracy,
  attempted,
  input,
  feedback,
  inputRef,
  onInput,
  onGrade,
  onFinish,
}: {
  current: AskItem;
  answerStyle: AnswerStyle;
  length: LengthMode;
  showAbbr: boolean;
  index: number;
  totalLabel: string;
  correctCount: number;
  streak: number;
  accuracy: number;
  attempted: number;
  input: string;
  feedback: Feedback;
  inputRef: RefObject<HTMLInputElement | null>;
  onInput: (value: string) => void;
  onGrade: (value: string) => void;
  onFinish: () => void;
}) {
  const showHint = showAbbr && current.direction === "capital";
  const expected = officialAnswer(current);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat
          label={length === "streak" ? "Tried" : "Question"}
          value={
            length === "streak" ? `${attempted}` : `${index + 1} / ${totalLabel}`
          }
        />
        <Stat label="Score" value={`${correctCount}`} />
        <Stat label="Streak" value={`${streak}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
      </div>

      <div
        className={`mt-5 rounded-2xl border px-4 py-5 ${
          feedback === "correct"
            ? "animate-pop border-ok bg-ok-soft"
            : feedback === "wrong"
              ? "animate-shake border-bad bg-bad-soft"
              : "border-line bg-bg"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {current.direction === "capital" ? "Capital from state" : "State from capital"}
        </p>
        <h3 className="mt-2 font-display text-2xl text-ink">{promptOf(current)}</h3>
        {showHint ? (
          <p className="mt-2 text-sm text-ink-muted">
            Hint: <span className="font-semibold text-ink">{current.state.abbr}</span>
          </p>
        ) : null}

        {answerStyle === "choice" ? (
          <div className="mt-4 grid gap-2">
            {current.options.map((option) => {
              const official = guessMatches(
                option,
                acceptedAnswers(current.state, current.direction),
              );
              const chosen = Boolean(feedback) && option === input;
              const showKey = Boolean(feedback);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onGrade(option)}
                  disabled={Boolean(feedback)}
                  className={`min-h-12 rounded-xl border px-3 py-2 text-left text-sm font-medium disabled:opacity-80 ${
                    showKey && official
                      ? "border-ok bg-ok-soft text-ink"
                      : showKey && chosen && !official
                        ? "border-bad bg-bad-soft text-ink"
                        : showKey
                          ? "border-line bg-surface text-ink-muted"
                          : "border-line bg-surface text-ink hover:border-accent/50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              onGrade(input);
            }}
          >
            <label className="text-sm font-semibold text-ink" htmlFor="states-answer">
              {current.direction === "capital" ? "Type the capital" : "Type the state"}
            </label>
            <input
              id="states-answer"
              ref={inputRef}
              value={input}
              onChange={(event) => onInput(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={Boolean(feedback)}
              placeholder={current.direction === "capital" ? "e.g. Sacramento" : "e.g. California"}
              className="snap-input mt-2"
            />
            <button
              type="submit"
              disabled={Boolean(feedback) || input.trim().length === 0}
              className="mt-3 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-50"
            >
              Check
            </button>
          </form>
        )}

        <p
          className={`mt-3 min-h-6 text-sm font-semibold ${
            feedback === "correct"
              ? "text-ok"
              : feedback === "wrong"
                ? "text-bad"
                : "font-medium text-ink-muted"
          }`}
          aria-live="polite"
        >
          {feedback === "correct"
            ? `Yes — ${current.state.name}: ${current.state.capital}.`
            : feedback === "wrong"
              ? `Not quite. ${current.state.name}: ${expected}.`
              : answerStyle === "choice"
                ? "Tap an answer."
                : "Type your answer and press Enter."}
        </p>
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onFinish}
          className="min-h-11 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          {length === "streak" ? "End early" : "Finish early"}
        </button>
      </div>
    </div>
  );
}

function ResultsPanel({
  length,
  correctCount,
  wrongCount,
  accuracy,
  bestStreak,
  misses,
  onAgain,
  onSetup,
}: {
  length: LengthMode;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  bestStreak: number;
  misses: Miss[];
  onAgain: () => void;
  onSetup: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Nice work</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {length === "streak"
          ? "Streak ended on a miss — those pairs are the ones to keep."
          : `${correctCount} correct in this set.`}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Correct" value={`${correctCount}`} />
        <Stat label="Wrong" value={`${wrongCount}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Best streak" value={`${bestStreak}`} />
      </div>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-ink">Missed pairs</h3>
        {misses.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">No misses. That’s the goal.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {misses.map((item) => (
              <li
                key={item.key}
                className="rounded-lg border border-line bg-bg px-2.5 py-1 text-sm"
              >
                {item.prompt}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
        >
          Practice again
        </button>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
