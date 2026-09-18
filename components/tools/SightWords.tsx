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
  DEFAULT_SIGHT_SET_SIZE,
  SIGHT_SET_SIZES,
  SIGHT_WORD_LISTS,
  dealSightSet,
  getSightList,
  nextSightWord,
  pickSightChoices,
  wordsMatch,
  type SightListId,
  type SightSetSize,
} from "@/lib/sight-words-data";

const TOOL_SLUG = "sight-words";
const TIMED_SECONDS = 60;
const BRIEF_FLASH_MS = 1500;

type AnswerMode = "flash" | "type";
type SessionMode = "practice" | "timed" | "streak";
type FlashStyle = "brief" | "persist";
type Phase = "setup" | "playing" | "results";
type Feedback = "correct" | "wrong" | null;

type AskItem = {
  word: string;
  choices: string[];
};

function buildAsk(word: string, list: readonly string[]): AskItem {
  return { word, choices: pickSightChoices(word, list) };
}

export function SightWords() {
  const [listId, setListId] = useState<SightListId>("pre-primer");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("flash");
  const [session, setSession] = useState<SessionMode>("practice");
  const [setSize, setSetSize] = useState<SightSetSize>(DEFAULT_SIGHT_SET_SIZE);
  const [flashStyle, setFlashStyle] = useState<FlashStyle>("brief");

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
  const [misses, setMisses] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMED_SECONDS);
  const [wordVisible, setWordVisible] = useState(true);
  const [focusWords, setFocusWords] = useState<string[] | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement>(null);
  const phaseRef = useRef(phase);
  const endingRef = useRef(false);
  const busyRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const sessionStartRef = useRef(0);
  const scoreRef = useRef({ correct: 0, wrong: 0 });

  const list = useMemo(() => getSightList(listId), [listId]);
  const pool = focusWords && focusWords.length > 0 ? focusWords : list.words;

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  const clearFlashTimer = () => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  };

  const revealWord = useCallback(
    (item: AskItem | null) => {
      clearFlashTimer();
      if (!item) {
        setWordVisible(false);
        return;
      }
      if (answerMode !== "flash" || flashStyle === "persist") {
        setWordVisible(true);
        return;
      }
      setWordVisible(true);
      flashTimerRef.current = window.setTimeout(() => {
        setWordVisible(false);
        flashTimerRef.current = null;
      }, BRIEF_FLASH_MS);
    },
    [answerMode, flashStyle],
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => () => {
    clearAdvanceTimer();
    clearFlashTimer();
  }, []);

  useEffect(() => {
    if (phase !== "playing" || answerMode !== "type" || feedback) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [answerMode, current, feedback, phase]);

  const startSession = useCallback(
    (retry?: string[]) => {
      const source = retry && retry.length > 0 ? retry : list.words;
      trackEvent(analyticsEvents.practiceStart, {
        tool: TOOL_SLUG,
        mode: `${session}-${answerMode}`,
      });
      endingRef.current = false;
      busyRef.current = false;
      clearAdvanceTimer();
      clearFlashTimer();
      scoreRef.current = { correct: 0, wrong: 0 };
      setFocusWords(retry);
      setCorrectCount(0);
      setWrongCount(0);
      setStreak(0);
      setBestStreak(0);
      setMisses([]);
      setInput("");
      setFeedback(null);
      setIndex(0);
      setTimeLeft(TIMED_SECONDS);
      sessionStartRef.current = Date.now();

      if (session === "practice") {
        const size = retry ? retry.length : setSize;
        const dealt = dealSightSet(source, size).map((word) =>
          buildAsk(word, list.words),
        );
        setDeck(dealt);
        const first = dealt[0] ?? null;
        setCurrent(first);
        revealWord(first);
      } else {
        const firstWord = nextSightWord(source, null);
        const first = buildAsk(firstWord, list.words);
        setDeck([]);
        setCurrent(first);
        revealWord(first);
      }
      setPhase("playing");
    },
    [answerMode, list.words, revealWord, session, setSize],
  );

  const finishSession = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    clearAdvanceTimer();
    clearFlashTimer();
    const { correct, wrong } = scoreRef.current;
    trackEvent(analyticsEvents.practiceFinish, {
      tool: TOOL_SLUG,
      mode: `${session}-${answerMode}`,
      score: correct,
      count: correct + wrong,
    });
    setPhase("results");
    setFeedback(null);
  }, [answerMode, session]);

  const goNext = useCallback(
    (wasCorrect: boolean) => {
      if (session === "streak" && !wasCorrect) {
        finishSession();
        return;
      }

      if (session === "practice") {
        const nextIndex = index + 1;
        if (nextIndex >= deck.length) {
          finishSession();
          return;
        }
        const upcoming = deck[nextIndex] ?? null;
        setIndex(nextIndex);
        setCurrent(upcoming);
        setInput("");
        setFeedback(null);
        busyRef.current = false;
        revealWord(upcoming);
        return;
      }

      const upcoming = buildAsk(nextSightWord(pool, current?.word ?? null), list.words);
      setCurrent(upcoming);
      setIndex((prev) => prev + 1);
      setInput("");
      setFeedback(null);
      busyRef.current = false;
      revealWord(upcoming);
    },
    [current?.word, deck, finishSession, index, list.words, pool, revealWord, session],
  );

  const grade = useCallback(
    (raw: string) => {
      if (!current || phaseRef.current !== "playing" || busyRef.current) return;
      const value = raw.trim();
      if (value.length === 0) return;

      busyRef.current = true;
      setInput(value);
      const ok = wordsMatch(value, current.word);
      setFeedback(ok ? "correct" : "wrong");
      setWordVisible(true);
      clearFlashTimer();

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
        setMisses((prev) =>
          prev.some((word) => wordsMatch(word, current.word))
            ? prev
            : [...prev, current.word],
        );
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

  useEffect(() => {
    if (phase !== "playing" || session !== "timed") return;

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
  }, [finishSession, phase, session]);

  useEffect(() => {
    if (phase !== "playing" || answerMode !== "flash" || feedback) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (busyRef.current || !current) return;
      const n = Number(event.key);
      if (n >= 1 && n <= current.choices.length) {
        event.preventDefault();
        grade(current.choices[n - 1]);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answerMode, current, feedback, grade, phase]);

  const attempted = correctCount + wrongCount;
  const accuracy =
    attempted === 0 ? 0 : Math.round((correctCount / attempted) * 100);
  const totalLabel =
    session === "practice" ? String(deck.length || setSize) : "∞";

  return (
    <div className="snap-panel">
      {phase === "setup" ? (
        <SetupPanel
          listId={listId}
          answerMode={answerMode}
          session={session}
          setSize={setSize}
          flashStyle={flashStyle}
          onList={setListId}
          onAnswerMode={setAnswerMode}
          onSession={setSession}
          onSetSize={setSetSize}
          onFlashStyle={setFlashStyle}
          onStart={() => startSession()}
        />
      ) : null}

      {phase === "playing" && current ? (
        <PlayPanel
          current={current}
          listLabel={list.label}
          answerMode={answerMode}
          session={session}
          flashStyle={flashStyle}
          wordVisible={wordVisible}
          index={index}
          totalLabel={totalLabel}
          correctCount={correctCount}
          streak={streak}
          accuracy={accuracy}
          attempted={attempted}
          timeLeft={timeLeft}
          input={input}
          feedback={feedback}
          inputRef={inputRef}
          onInput={setInput}
          onGrade={grade}
          onFlashAgain={() => revealWord(current)}
          onFinish={finishSession}
        />
      ) : null}

      {phase === "results" ? (
        <ResultsPanel
          session={session}
          correctCount={correctCount}
          wrongCount={wrongCount}
          accuracy={accuracy}
          bestStreak={bestStreak}
          misses={misses}
          onAgain={() => startSession(focusWords)}
          onRetryMissed={
            misses.length > 0 ? () => startSession(misses) : undefined
          }
          onSetup={() => {
            setPhase("setup");
            setCurrent(null);
            setFeedback(null);
            setFocusWords(undefined);
            busyRef.current = false;
            endingRef.current = false;
          }}
        />
      ) : null}
    </div>
  );
}

function SetupPanel({
  listId,
  answerMode,
  session,
  setSize,
  flashStyle,
  onList,
  onAnswerMode,
  onSession,
  onSetSize,
  onFlashStyle,
  onStart,
}: {
  listId: SightListId;
  answerMode: AnswerMode;
  session: SessionMode;
  setSize: SightSetSize;
  flashStyle: FlashStyle;
  onList: (value: SightListId) => void;
  onAnswerMode: (value: AnswerMode) => void;
  onSession: (value: SessionMode) => void;
  onSetSize: (value: SightSetSize) => void;
  onFlashStyle: (value: FlashStyle) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose a list</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Public-domain Dolch sight words. Start with Pre-Primer, then move up
        when the words feel automatic.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {SIGHT_WORD_LISTS.map((item) => (
          <ModeButton
            key={item.id}
            title={item.label}
            detail={`${item.words.length} words`}
            active={listId === item.id}
            onClick={() => onList(item.id)}
          />
        ))}
      </div>

      <h3 className="mt-6 font-display text-xl text-ink">Mode</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ModeButton
          title="Flash"
          detail="See the word, then pick it from four."
          active={answerMode === "flash"}
          onClick={() => onAnswerMode("flash")}
        />
        <ModeButton
          title="Type"
          detail="See the word, then type it. Enter submits."
          active={answerMode === "type"}
          onClick={() => onAnswerMode("type")}
        />
      </div>

      {answerMode === "flash" ? (
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-ink">Flash style</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <ModeButton
              title="Brief"
              detail="Hide after a beat, then choose."
              active={flashStyle === "brief"}
              onClick={() => onFlashStyle("brief")}
            />
            <ModeButton
              title="Stay visible"
              detail="Keep the word on screen while you pick."
              active={flashStyle === "persist"}
              onClick={() => onFlashStyle("persist")}
            />
          </div>
        </fieldset>
      ) : null}

      <h3 className="mt-6 font-display text-xl text-ink">Session</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ModeButton
          title="Practice"
          detail="A short shuffled set. Stop when you like."
          active={session === "practice"}
          onClick={() => onSession("practice")}
        />
        <ModeButton
          title="Timed"
          detail="60 seconds. How many can you get?"
          active={session === "timed"}
          onClick={() => onSession("timed")}
        />
        <ModeButton
          title="Streak"
          detail="Keep going until the first miss."
          active={session === "streak"}
          onClick={() => onSession("streak")}
        />
      </div>

      {session === "practice" ? (
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-ink">Set size</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SIGHT_SET_SIZES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={setSize === item.id}
                onClick={() => onSetSize(item.id)}
                className={`min-h-11 rounded-xl border text-sm font-semibold ${
                  setSize === item.id
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-bg hover:border-accent/40"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

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
  listLabel,
  answerMode,
  session,
  flashStyle,
  wordVisible,
  index,
  totalLabel,
  correctCount,
  streak,
  accuracy,
  attempted,
  timeLeft,
  input,
  feedback,
  inputRef,
  onInput,
  onGrade,
  onFlashAgain,
  onFinish,
}: {
  current: AskItem;
  listLabel: string;
  answerMode: AnswerMode;
  session: SessionMode;
  flashStyle: FlashStyle;
  wordVisible: boolean;
  index: number;
  totalLabel: string;
  correctCount: number;
  streak: number;
  accuracy: number;
  attempted: number;
  timeLeft: number;
  input: string;
  feedback: Feedback;
  inputRef: RefObject<HTMLInputElement | null>;
  onInput: (value: string) => void;
  onGrade: (value: string) => void;
  onFlashAgain: () => void;
  onFinish: () => void;
}) {
  const showChoices =
    answerMode === "flash" &&
    (flashStyle === "persist" || !wordVisible || Boolean(feedback));

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat
          label={session === "timed" ? "Time" : session === "streak" ? "Tried" : "Word"}
          value={
            session === "timed"
              ? `${Math.ceil(timeLeft)}s`
              : session === "practice"
                ? `${index + 1} / ${totalLabel}`
                : `${attempted}`
          }
        />
        <Stat label="Score" value={`${correctCount}`} />
        <Stat label="Streak" value={`${streak}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
      </div>

      <div
        className={`mt-5 rounded-2xl border px-4 py-6 text-center sm:px-6 ${
          feedback === "correct"
            ? "animate-pop border-ok bg-ok-soft"
            : feedback === "wrong"
              ? "animate-shake border-bad bg-bad-soft"
              : "border-line bg-bg"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {listLabel}
          <span className="mx-2 text-line">·</span>
          {answerMode === "flash" ? "Flash" : "Type"}
        </p>
        <p
          className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl"
          aria-live={answerMode === "type" || wordVisible ? "polite" : "off"}
        >
          {wordVisible ? current.word : "· · ·"}
        </p>
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
            ? `Yes — ${current.word}`
            : feedback === "wrong"
              ? `Not quite. It is “${current.word}”.`
              : answerMode === "flash"
                ? wordVisible && flashStyle === "brief"
                  ? "Look at the word…"
                  : "Which word did you see?"
                : "Type the word and press Enter."}
        </p>

        {answerMode === "flash" ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {current.choices.map((option, optionIndex) => {
              const official = wordsMatch(option, current.word);
              const chosen = Boolean(feedback) && wordsMatch(option, input);
              const showKey = Boolean(feedback);
              return (
                <button
                  key={`${option}-${optionIndex}`}
                  type="button"
                  onClick={() => onGrade(option)}
                  disabled={!showChoices || Boolean(feedback)}
                  className={`min-h-12 rounded-xl border px-3 py-2 text-left text-base font-medium disabled:opacity-80 ${
                    !showChoices
                      ? "border-line bg-surface text-ink-muted"
                      : showKey && official
                        ? "border-ok bg-ok-soft text-ink"
                        : showKey && chosen && !official
                          ? "border-bad bg-bad-soft text-ink"
                          : showKey
                            ? "border-line bg-surface text-ink-muted"
                            : "border-line bg-surface text-ink hover:border-accent/50"
                  }`}
                >
                  <span className="mr-2 text-xs font-semibold text-ink-muted">
                    {optionIndex + 1}
                  </span>
                  {showChoices ? option : "?"}
                </button>
              );
            })}
          </div>
        ) : (
          <form
            className="mt-5 text-left"
            onSubmit={(event) => {
              event.preventDefault();
              onGrade(input);
            }}
          >
            <label className="text-sm font-semibold text-ink" htmlFor="sight-answer">
              Type the word
            </label>
            <input
              id="sight-answer"
              ref={inputRef}
              value={input}
              onChange={(event) => onInput(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              disabled={Boolean(feedback)}
              className="snap-input mt-2 text-lg"
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

        {answerMode === "flash" && flashStyle === "brief" && !feedback ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={onFlashAgain}
              className="min-h-11 text-sm font-semibold text-secondary hover:opacity-80"
            >
              Flash again
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onFinish}
          className="min-h-11 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          {session === "practice" ? "Finish this set" : "End early"}
        </button>
      </div>
    </div>
  );
}

function ResultsPanel({
  session,
  correctCount,
  wrongCount,
  accuracy,
  bestStreak,
  misses,
  onAgain,
  onRetryMissed,
  onSetup,
}: {
  session: SessionMode;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  bestStreak: number;
  misses: string[];
  onAgain: () => void;
  onRetryMissed?: () => void;
  onSetup: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Nice work</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {session === "timed"
          ? "Sixty seconds are up."
          : session === "streak"
            ? "Streak ended on a miss — those are the words to keep."
            : `${correctCount} correct in this set.`}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Correct" value={`${correctCount}`} />
        <Stat label="Wrong" value={`${wrongCount}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Best streak" value={`${bestStreak}`} />
      </div>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-ink">Missed words</h3>
        {misses.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">No misses. That’s the goal.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {misses.map((word) => (
              <li
                key={word}
                className="rounded-lg border border-line bg-bg px-2.5 py-1 text-sm"
              >
                {word}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
            Retry missed
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
