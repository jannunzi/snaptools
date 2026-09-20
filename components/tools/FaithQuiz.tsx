"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ModeButton, Stat } from "@/components/tools/faith-ui";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import {
  dealQuestions,
  nextQuestion,
  type FaithQuestion,
} from "@/lib/first-communion";

const QUIZ_LENGTH = 8;

type SessionMode = "practice" | "quiz" | "streak";
type AnswerStyle = "choice" | "match";
type Phase = "setup" | "playing" | "results";
type Feedback = "correct" | "wrong" | null;

type Miss = { id: string; prompt: string; answer: string };

type FaithQuizProps = {
  toolSlug: string;
  intro: string;
  questions: FaithQuestion[];
  matchQuestions?: FaithQuestion[];
};

export function FaithQuiz({
  toolSlug,
  intro,
  questions,
  matchQuestions,
}: FaithQuizProps) {
  const hasMatch = Boolean(matchQuestions && matchQuestions.length > 0);
  const [session, setSession] = useState<SessionMode>("practice");
  const [style, setStyle] = useState<AnswerStyle>("choice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [deck, setDeck] = useState<FaithQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<FaithQuestion | null>(null);
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

  const pool =
    style === "match" && matchQuestions && matchQuestions.length > 0
      ? matchQuestions
      : questions;

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
      tool: toolSlug,
      mode: `${session}-${style}`,
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
    setChosen("");
    setFeedback(null);
    setIndex(0);

    if (session === "streak" || session === "practice") {
      const first = nextQuestion(pool);
      setDeck([]);
      setCurrent(first);
    } else {
      const nextDeck = dealQuestions(pool, QUIZ_LENGTH);
      setDeck(nextDeck);
      setCurrent(nextDeck[0] ?? null);
    }
    setPhase("playing");
  }, [pool, session, style, toolSlug]);

  const finishSession = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    clearAdvanceTimer();
    const { correct, wrong } = scoreRef.current;
    trackEvent(analyticsEvents.practiceFinish, {
      tool: toolSlug,
      mode: `${session}-${style}`,
      score: correct,
      count: correct + wrong,
    });
    setPhase("results");
    setFeedback(null);
  }, [session, style, toolSlug]);

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
        setChosen("");
        setFeedback(null);
        busyRef.current = false;
        return;
      }
      const upcoming = nextQuestion(pool, current?.id);
      setCurrent(upcoming);
      setIndex((prev) => prev + 1);
      setChosen("");
      setFeedback(null);
      busyRef.current = false;
    },
    [current?.id, deck, finishSession, index, pool, session],
  );

  const grade = useCallback(
    (option: string) => {
      if (!current || phaseRef.current !== "playing" || busyRef.current) return;
      busyRef.current = true;
      setChosen(option);
      const ok = option === current.answer;
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
          if (prev.some((item) => item.id === current.id)) return prev;
          return [
            ...prev,
            {
              id: current.id,
              prompt: current.prompt,
              answer: current.answer,
            },
          ];
        });
      }

      const delay = ok ? 1100 : 2000;
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

  return (
    <div className="snap-panel">
      {phase === "setup" ? (
        <div>
          <h2 className="font-display text-2xl text-ink">Choose a quiz</h2>
          <p className="mt-1 text-sm text-ink-muted">{intro}</p>

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
              detail={`${QUIZ_LENGTH} questions, then a score.`}
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

          {hasMatch ? (
            <>
              <h3 className="mt-6 font-display text-xl text-ink">Style</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <ModeButton
                  title="Multiple choice"
                  detail="Mix of order, names, and moments."
                  active={style === "choice"}
                  onClick={() => setStyle("choice")}
                />
                <ModeButton
                  title="Match"
                  detail="Name the part of Mass for each moment."
                  active={style === "match"}
                  onClick={() => setStyle("match")}
                />
              </div>
            </>
          ) : null}

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
              {current.topic}
            </p>
            <h3 className="mt-2 font-display text-2xl text-ink">
              {current.prompt}
            </h3>
            <div className="mt-4 grid gap-2">
              {current.options.map((option) => {
                const official = option === current.answer;
                const selected = chosen === option;
                const showKey = Boolean(feedback);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => grade(option)}
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
                ? `Yes. ${current.explain}`
                : feedback === "wrong"
                  ? `${current.answer}. ${current.explain}`
                  : "Tap the best answer."}
            </p>
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
              ? "Streak ended on a miss — those are the ones to keep."
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
              <ul className="mt-2 flex flex-col gap-2">
                {misses.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm"
                  >
                    <span className="block text-ink">{item.prompt}</span>
                    <span className="mt-0.5 block text-ink-muted">
                      {item.answer}
                    </span>
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
