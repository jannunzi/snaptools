"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  normalizeSpelling,
  spellingLanguages,
  spellingLists,
  type SpellingLang,
  type SpellingLevel,
  type SpellingWord,
} from "@/lib/spelling-words";

type Phase = "setup" | "playing" | "results";
type Feedback = "correct" | "wrong" | null;

function pickWord(list: SpellingWord[], last: SpellingWord | null) {
  if (list.length === 0) return { word: "cat", speak: "cat" };
  let pick = list[Math.floor(Math.random() * list.length)];
  for (let i = 0; i < 8 && last && list.length > 1; i += 1) {
    if (pick.word !== last.word) break;
    pick = list[Math.floor(Math.random() * list.length)];
  }
  return pick;
}

function speakWord(word: SpellingWord, locale: string, slow: boolean) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word.speak);
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()),
  );
  if (match) utterance.voice = match;
  utterance.lang = locale;
  utterance.rate = slow ? 0.55 : 0.9;
  window.speechSynthesis.speak(utterance);
}

export function SpellingPractice() {
  const [lang, setLang] = useState<SpellingLang>("en");
  const [level, setLevel] = useState<SpellingLevel>("easy");
  const [slow, setSlow] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [current, setCurrent] = useState<SpellingWord>(spellingLists.en.easy[0]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const slowRef = useRef(slow);
  const locale = spellingLanguages.find((item) => item.id === lang)?.locale ?? "en-US";

  const words = useMemo(() => spellingLists[lang][level], [lang, level]);

  useEffect(() => {
    slowRef.current = slow;
  }, [slow]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.getVoices();
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const clearAdvance = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  const playCurrent = useCallback(
    (word: SpellingWord) => {
      speakWord(word, locale, slowRef.current);
    },
    [locale],
  );

  const start = () => {
    const first = pickWord(words, null);
    setCurrent(first);
    setInput("");
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAttempted(0);
    setMissed([]);
    setPhase("playing");
    busyRef.current = false;
    clearAdvance();
    window.setTimeout(() => {
      playCurrent(first);
      inputRef.current?.focus();
    }, 80);
  };

  const nextRound = useCallback(() => {
    const next = pickWord(words, current);
    setCurrent(next);
    setInput("");
    setFeedback(null);
    busyRef.current = false;
    window.setTimeout(() => {
      playCurrent(next);
      inputRef.current?.focus();
    }, 40);
  }, [current, playCurrent, words]);

  const submit = useCallback(() => {
    if (phase !== "playing" || busyRef.current) return;
    const guess = normalizeSpelling(input);
    if (!guess) return;
    busyRef.current = true;
    const ok = guess === normalizeSpelling(current.word);
    setFeedback(ok ? "correct" : "wrong");
    setAttempted((n) => n + 1);
    if (ok) {
      setScore((n) => n + 1);
      setStreak((n) => {
        const next = n + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setStreak(0);
      setMissed((list) =>
        list.includes(current.word) ? list : [...list, current.word],
      );
    }
    advanceTimerRef.current = window.setTimeout(() => {
      nextRound();
    }, ok ? 700 : 1400);
  }, [current.word, input, nextRound, phase]);

  useEffect(() => {
    return () => clearAdvance();
  }, []);

  return (
    <div className="no-print rounded-2xl border-2 border-line bg-surface p-4 snap-shadow sm:p-6">
      {phase === "setup" ? (
        <div>
          <h2 className="font-display text-2xl text-ink">Listen, then spell</h2>
          <p className="mt-1 text-sm text-ink-muted">
            The browser speaks a word. Type what you hear. Instant feedback,
            plus a streak if you keep going.
          </p>

          <h3 className="mt-5 font-display text-xl text-ink">Language</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {spellingLanguages.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={lang === item.id}
                onClick={() => setLang(item.id)}
                className={`rounded-xl border-2 p-3 text-left ${
                  lang === item.id
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-bg hover:border-accent/50"
                }`}
              >
                <span className="block font-bold text-ink">{item.label}</span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {item.locale}
                </span>
              </button>
            ))}
          </div>

          <h3 className="mt-5 font-display text-xl text-ink">Difficulty</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ModeChoice
              title="Easy"
              detail="Short everyday words for kids and new learners."
              active={level === "easy"}
              onClick={() => setLevel("easy")}
            />
            <ModeChoice
              title="Medium"
              detail="Longer words, accents, and a few trickier spellings."
              active={level === "medium"}
              onClick={() => setLevel("medium")}
            />
          </div>

          <label className="mt-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              className="size-4 accent-[var(--accent)]"
              checked={slow}
              onChange={(event) => setSlow(event.target.checked)}
            />
            Slow speech
          </label>

          <button
            type="button"
            onClick={start}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-bold text-accent-ink hover:brightness-110 sm:w-auto"
          >
            Start practice
          </button>
        </div>
      ) : null}

      {phase === "playing" ? (
        <div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Score" value={`${score}`} />
            <Stat label="Streak" value={`${streak}`} />
            <Stat label="Tried" value={`${attempted}`} />
          </div>

          <p className="mt-5 text-center text-sm font-bold uppercase tracking-wide text-secondary-strong">
            {spellingLanguages.find((item) => item.id === lang)?.label} ·{" "}
            {level}
          </p>
          <p className="mt-2 text-center font-display text-2xl text-ink">
            What word did you hear?
          </p>

          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => playCurrent(current)}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-ink hover:brightness-105"
            >
              Replay audio
            </button>
            <label className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                className="size-4 accent-[var(--accent)]"
                checked={slow}
                onChange={(event) => setSlow(event.target.checked)}
              />
              Slow
            </label>
          </div>

          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className="sr-only" htmlFor="spelling-answer">
              Type the spelling
            </label>
            <input
              id="spelling-answer"
              ref={inputRef}
              value={input}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              disabled={Boolean(feedback)}
              onChange={(event) => setInput(event.target.value)}
              className={`w-full rounded-xl border-2 bg-bg px-4 py-3 text-center text-2xl font-semibold tracking-wide text-ink outline-none focus:border-accent ${
                feedback === "correct"
                  ? "border-ok bg-ok-soft animate-pop"
                  : feedback === "wrong"
                    ? "border-bad bg-bad-soft animate-shake"
                    : "border-line"
              }`}
              placeholder="Type the word"
            />
            <button
              type="submit"
              disabled={Boolean(feedback) || !input.trim()}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-bold text-accent-ink hover:brightness-110 disabled:opacity-50"
            >
              Check
            </button>
          </form>

          {feedback === "wrong" ? (
            <p className="mt-3 text-center text-sm font-semibold text-bad">
              It was <span className="font-display text-lg">{current.word}</span>
            </p>
          ) : null}
          {feedback === "correct" ? (
            <p className="mt-3 text-center text-sm font-bold text-ok">
              Yes — {current.word}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              clearAdvance();
              setPhase("results");
              setFeedback(null);
              window.speechSynthesis.cancel();
            }}
            className="mt-6 block w-full min-h-11 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            Finish practice
          </button>
        </div>
      ) : null}

      {phase === "results" ? (
        <div>
          <h2 className="font-display text-2xl text-ink">Nice work</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Hear it again later — spelling sticks with short rounds.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Score" value={`${score}`} />
            <Stat
              label="Accuracy"
              value={`${
                attempted === 0 ? 0 : Math.round((score / attempted) * 100)
              }%`}
            />
            <Stat label="Best streak" value={`${bestStreak}`} />
            <Stat label="Tried" value={`${attempted}`} />
          </div>
          <section className="mt-5">
            <h3 className="text-sm font-bold text-ink">Missed words</h3>
            {missed.length === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">No misses.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {missed.map((word) => (
                  <li
                    key={word}
                    className="rounded-lg border-2 border-line bg-bg px-2.5 py-1 text-sm font-semibold"
                  >
                    {word}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={start}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-ink hover:brightness-110"
            >
              Practice again
            </button>
            <button
              type="button"
              onClick={() => setPhase("setup")}
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

function ModeChoice({
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
      className={`rounded-xl border-2 p-3 text-left ${
        active
          ? "border-accent bg-accent-soft"
          : "border-line bg-bg hover:border-accent/50"
      }`}
    >
      <span className="block font-bold text-ink">{title}</span>
      <span className="mt-1 block text-sm text-ink-muted">{detail}</span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-line bg-bg px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}
