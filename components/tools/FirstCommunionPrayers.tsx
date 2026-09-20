"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModeButton, Stat } from "@/components/tools/faith-ui";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import {
  PRAYERS,
  getPrayer,
  pickFrom,
  shuffle,
  type Prayer,
  type PrayerBlank,
  type PrayerId,
} from "@/lib/first-communion";

const TOOL_SLUG = "first-communion-prayers";
const QUIZ_LENGTH = 8;

type Activity = "order" | "blank" | "mixed";
type SessionMode = "practice" | "quiz" | "streak";
type PrayerFilter = "all" | PrayerId;
type Phase = "setup" | "playing" | "results";
type Feedback = "correct" | "wrong" | null;

type OrderAsk = {
  kind: "order";
  key: string;
  prayer: Prayer;
  choices: string[];
};

type BlankAsk = {
  kind: "blank";
  key: string;
  prayer: Prayer;
  blank: PrayerBlank;
  options: string[];
};

type Ask = OrderAsk | BlankAsk;

type Miss = { key: string; label: string };

function sameOrder(left: string[], right: string[]) {
  return left.length === right.length && left.every((line, i) => line === right[i]);
}

function buildOrderAsk(prayer: Prayer): OrderAsk {
  let choices = shuffle(prayer.lines);
  for (let i = 0; i < 8 && sameOrder(choices, prayer.lines); i += 1) {
    choices = shuffle(prayer.lines);
  }
  return {
    kind: "order",
    key: `order-${prayer.id}-${choices.join("|")}`,
    prayer,
    choices,
  };
}

function buildBlankAsk(prayer: Prayer, lastBlankId?: string): BlankAsk {
  const pool =
    prayer.blanks.length > 1
      ? prayer.blanks.filter((item) => item.id !== lastBlankId)
      : prayer.blanks;
  const blank = pickFrom(pool);
  return {
    kind: "blank",
    key: `blank-${blank.id}`,
    prayer,
    blank,
    options: shuffle(blank.options),
  };
}

function pickPrayer(filter: PrayerFilter, lastId?: PrayerId): Prayer {
  const pool =
    filter === "all"
      ? lastId
        ? PRAYERS.filter((prayer) => prayer.id !== lastId)
        : PRAYERS
      : [getPrayer(filter)];
  return pickFrom(pool);
}

function pickKind(activity: Activity): Ask["kind"] {
  if (activity === "mixed") return Math.random() < 0.5 ? "order" : "blank";
  return activity;
}

function nextAsk(
  filter: PrayerFilter,
  activity: Activity,
  last: Ask | null,
): Ask {
  const prayer = pickPrayer(filter, last?.prayer.id);
  const kind = pickKind(activity);
  if (kind === "order") return buildOrderAsk(prayer);
  const lastBlank = last?.kind === "blank" ? last.blank.id : undefined;
  return buildBlankAsk(prayer, lastBlank);
}

function dealAsks(
  filter: PrayerFilter,
  activity: Activity,
  count: number,
): Ask[] {
  const deck: Ask[] = [];
  let last: Ask | null = null;
  for (let i = 0; i < count; i += 1) {
    const ask = nextAsk(filter, activity, last);
    deck.push(ask);
    last = ask;
  }
  return deck;
}

function askLabel(ask: Ask) {
  if (ask.kind === "order") return `${ask.prayer.title} — put the lines in order`;
  return `${ask.prayer.title} — missing word: ${ask.blank.word}`;
}

export function FirstCommunionPrayers() {
  const [activity, setActivity] = useState<Activity>("mixed");
  const [session, setSession] = useState<SessionMode>("practice");
  const [filter, setFilter] = useState<PrayerFilter>("all");
  const [openPrayer, setOpenPrayer] = useState<PrayerId | null>("our-father");

  const [phase, setPhase] = useState<Phase>("setup");
  const [deck, setDeck] = useState<Ask[]>([]);
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<Ask | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [chosen, setChosen] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);

  const phaseRef = useRef(phase);
  const endingRef = useRef(false);
  const busyRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const scoreRef = useRef({ correct: 0, wrong: 0 });

  const remaining = useMemo(() => {
    if (!current || current.kind !== "order") return [];
    return current.choices.filter((line) => !placed.includes(line));
  }, [current, placed]);

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

  const startSession = useCallback(() => {
    trackEvent(analyticsEvents.practiceStart, {
      tool: TOOL_SLUG,
      mode: `${session}-${activity}`,
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
    setPlaced([]);
    setChosen("");
    setFeedback(null);
    setIndex(0);

    if (session === "quiz") {
      const nextDeck = dealAsks(filter, activity, QUIZ_LENGTH);
      setDeck(nextDeck);
      setCurrent(nextDeck[0] ?? null);
    } else {
      const first = nextAsk(filter, activity, null);
      setDeck([]);
      setCurrent(first);
    }
    setPhase("playing");
  }, [activity, filter, session]);

  const finishSession = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    clearAdvanceTimer();
    const { correct, wrong } = scoreRef.current;
    trackEvent(analyticsEvents.practiceFinish, {
      tool: TOOL_SLUG,
      mode: `${session}-${activity}`,
      score: correct,
      count: correct + wrong,
    });
    setPhase("results");
    setFeedback(null);
  }, [activity, session]);

  const mark = useCallback(
    (ok: boolean, ask: Ask) => {
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
          if (prev.some((item) => item.key === ask.key)) return prev;
          return [...prev, { key: ask.key, label: askLabel(ask) }];
        });
      }
    },
    [],
  );

  const goNext = useCallback(
    (wasCorrect: boolean) => {
      if (session === "streak" && !wasCorrect) {
        finishSession();
        return;
      }
      if (session === "quiz") {
        const nextIndex = index + 1;
        if (nextIndex >= deck.length) {
          finishSession();
          return;
        }
        setIndex(nextIndex);
        setCurrent(deck[nextIndex] ?? null);
        setPlaced([]);
        setChosen("");
        setFeedback(null);
        busyRef.current = false;
        return;
      }
      const upcoming = nextAsk(filter, activity, current);
      setCurrent(upcoming);
      setIndex((prev) => prev + 1);
      setPlaced([]);
      setChosen("");
      setFeedback(null);
      busyRef.current = false;
    },
    [activity, current, deck, filter, finishSession, index, session],
  );

  const settle = useCallback(
    (ok: boolean, ask: Ask) => {
      setFeedback(ok ? "correct" : "wrong");
      mark(ok, ask);
      const delay = ok ? 1200 : 2200;
      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => {
        if (endingRef.current || phaseRef.current !== "playing") {
          busyRef.current = false;
          return;
        }
        goNext(ok);
      }, delay);
    },
    [goNext, mark],
  );

  const placeLine = (line: string) => {
    if (!current || current.kind !== "order" || feedback || busyRef.current) {
      return;
    }
    const nextPlaced = [...placed, line];
    setPlaced(nextPlaced);
    if (nextPlaced.length < current.prayer.lines.length) return;
    busyRef.current = true;
    settle(sameOrder(nextPlaced, current.prayer.lines), current);
  };

  const undoLine = () => {
    if (feedback || busyRef.current) return;
    setPlaced((prev) => prev.slice(0, -1));
  };

  const gradeBlank = (option: string) => {
    if (!current || current.kind !== "blank" || busyRef.current) return;
    busyRef.current = true;
    setChosen(option);
    settle(option === current.blank.word, current);
  };

  const attempted = correctCount + wrongCount;
  const accuracy =
    attempted === 0 ? 0 : Math.round((correctCount / attempted) * 100);

  return (
    <div className="snap-panel">
      {phase === "setup" ? (
        <div>
          <h2 className="font-display text-2xl text-ink">Practice the prayers</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Our Father, Hail Mary, Glory Be, and a child-friendly Act of
            Contrition — the wording many US parishes teach for First Communion.
          </p>

          <h3 className="mt-6 font-display text-xl text-ink">Activity</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ModeButton
              title="Put lines in order"
              detail="Tap the lines of a prayer in the right order."
              active={activity === "order"}
              onClick={() => setActivity("order")}
            />
            <ModeButton
              title="Missing words"
              detail="Fill in a word from four choices."
              active={activity === "blank"}
              onClick={() => setActivity("blank")}
            />
            <ModeButton
              title="Both"
              detail="Mix order and missing words."
              active={activity === "mixed"}
              onClick={() => setActivity("mixed")}
            />
          </div>

          <h3 className="mt-6 font-display text-xl text-ink">Mode</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ModeButton
              title="Practice"
              detail="Keep going. End when you want."
              active={session === "practice"}
              onClick={() => setSession("practice")}
            />
            <ModeButton
              title="Short quiz"
              detail={`${QUIZ_LENGTH} items, then a score.`}
              active={session === "quiz"}
              onClick={() => setSession("quiz")}
            />
            <ModeButton
              title="Streak"
              detail="Keep going until the first miss."
              active={session === "streak"}
              onClick={() => setSession("streak")}
            />
          </div>

          <h3 className="mt-6 font-display text-xl text-ink">Prayer</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                { id: "all" as const, label: "All four" },
                ...PRAYERS.map((prayer) => ({
                  id: prayer.id,
                  label: prayer.title,
                })),
              ] satisfies { id: PrayerFilter; label: string }[]
            ).map((item) => {
              const selected = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
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

          <section className="mt-8">
            <h3 className="font-display text-xl text-ink">Read the prayers</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Read first if you want. Then put the lines in order or fill a
              missing word.
            </p>
            <ul className="mt-3 space-y-2">
              {PRAYERS.map((prayer) => {
                const open = openPrayer === prayer.id;
                return (
                  <li key={prayer.id} className="rounded-xl border border-line bg-bg">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
                      onClick={() => setOpenPrayer(open ? null : prayer.id)}
                      aria-expanded={open}
                    >
                      <span>
                        <span className="block font-semibold text-ink">
                          {prayer.title}
                        </span>
                        {prayer.alsoCalled ? (
                          <span className="mt-0.5 block text-sm text-ink-muted">
                            {prayer.alsoCalled}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-sm text-ink-muted">
                        {open ? "Hide" : "Show"}
                      </span>
                    </button>
                    {open ? (
                      <ol className="border-t border-line px-3 py-3 text-sm leading-relaxed text-ink">
                        {prayer.lines.map((line) => (
                          <li key={line} className="mt-1 first:mt-0">
                            {line}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          <button
            type="button"
            onClick={startSession}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink sm:w-auto"
          >
            Start
          </button>
        </div>
      ) : null}

      {phase === "playing" && current ? (
        <div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat
              label={session === "quiz" ? "Question" : "Tried"}
              value={
                session === "quiz"
                  ? `${index + 1} / ${deck.length}`
                  : `${attempted}`
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
              {current.prayer.title}
              {current.kind === "order" ? " · In order" : " · Missing word"}
            </p>
            <h3 className="mt-2 font-display text-2xl text-ink">
              {current.kind === "order"
                ? `Put the ${current.prayer.title} in order`
                : "Choose the missing word"}
            </h3>

            {current.kind === "order" ? (
              <OrderPlay
                ask={current}
                placed={placed}
                remaining={remaining}
                feedback={feedback}
                onPlace={placeLine}
                onUndo={undoLine}
              />
            ) : (
              <BlankPlay
                ask={current}
                chosen={chosen}
                feedback={feedback}
                onGrade={gradeBlank}
              />
            )}
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={finishSession}
              className="min-h-11 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              {session === "streak" ? "End early" : "Finish early"}
            </button>
          </div>
        </div>
      ) : null}

      {phase === "results" ? (
        <div>
          <h2 className="font-display text-2xl text-ink">Nice work</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {session === "streak"
              ? "Streak ended on a miss — keep those prayers close."
              : `${correctCount} correct in this set.`}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Correct" value={`${correctCount}`} />
            <Stat label="Wrong" value={`${wrongCount}`} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Best streak" value={`${bestStreak}`} />
          </div>
          <section className="mt-5">
            <h3 className="text-sm font-semibold text-ink">To review</h3>
            {misses.length === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">
                No misses. That’s the goal.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {misses.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-lg border border-line bg-bg px-2.5 py-1 text-sm"
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={startSession}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
            >
              Practice again
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase("setup");
                setCurrent(null);
                setFeedback(null);
                busyRef.current = false;
                endingRef.current = false;
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Change settings
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OrderPlay({
  ask,
  placed,
  remaining,
  feedback,
  onPlace,
  onUndo,
}: {
  ask: OrderAsk;
  placed: string[];
  remaining: string[];
  feedback: Feedback;
  onPlace: (line: string) => void;
  onUndo: () => void;
}) {
  const showAnswer = feedback === "wrong";
  const shown = showAnswer ? ask.prayer.lines : placed;

  return (
    <div className="mt-4">
      <ol className="space-y-2">
        {ask.prayer.lines.map((official, index) => {
          const line = shown[index];
          const ok = Boolean(line) && line === official;
          return (
            <li
              key={`${official}-${index}`}
              className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${
                !line
                  ? "border-dashed border-line bg-surface text-ink-muted"
                  : showAnswer
                    ? "border-ok bg-ok-soft text-ink"
                    : ok && feedback === "correct"
                      ? "border-ok bg-ok-soft text-ink"
                      : "border-line bg-surface text-ink"
              }`}
            >
              <span className="mr-2 tabular-nums text-ink-muted">
                {index + 1}.
              </span>
              {line || "Tap a line below"}
            </li>
          );
        })}
      </ol>

      {feedback ? (
        <p
          className={`mt-3 text-sm font-semibold ${
            feedback === "correct" ? "text-ok" : "text-bad"
          }`}
          aria-live="polite"
        >
          {feedback === "correct"
            ? "Yes — that is the prayer."
            : "Not quite. Here is the prayer in order."}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {remaining.map((line) => (
              <button
                key={line}
                type="button"
                onClick={() => onPlace(line)}
                className="min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-left text-sm font-medium text-ink hover:border-accent/50"
              >
                {line}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onUndo}
            disabled={placed.length === 0}
            className="mt-3 min-h-10 text-sm font-semibold text-ink-muted hover:text-ink disabled:opacity-40"
          >
            Undo last line
          </button>
        </>
      )}
    </div>
  );
}

function BlankPlay({
  ask,
  chosen,
  feedback,
  onGrade,
}: {
  ask: BlankAsk;
  chosen: string;
  feedback: Feedback;
  onGrade: (option: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className="rounded-xl border border-line bg-surface px-3 py-3 text-base leading-relaxed text-ink">
        {ask.blank.before}
        <span
          className={`mx-0.5 inline-block min-w-[4.5rem] border-b-2 px-1 text-center font-semibold ${
            feedback === "correct"
              ? "border-ok text-ok"
              : feedback === "wrong"
                ? "border-bad text-bad"
                : "border-ink text-ink"
          }`}
        >
          {feedback ? ask.blank.word : chosen || "_____"}
        </span>
        {ask.blank.after}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {ask.options.map((option) => {
          const official = option === ask.blank.word;
          const selected = chosen === option;
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
                  : showKey && selected && !official
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
          ? `Yes — “${ask.blank.word}.”`
          : feedback === "wrong"
            ? `The word is “${ask.blank.word}.”`
            : "Tap the missing word."}
      </p>
    </div>
  );
}
