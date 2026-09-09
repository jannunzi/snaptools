"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bankSize,
  dealSpellingSet,
  DEFAULT_SET_SIZE,
  getSpellingBank,
  getSpellingList,
  spellingDifficulties,
  spellingLists,
  spellingMatches,
  spellingSetSizes,
  type SpellingDifficulty,
  type SpellingLang,
  type SpellingSetSize,
} from "@/lib/spelling-words";
import {
  browserLocaleFor,
  DEFAULT_ENGLISH_ACCENT,
  DEFAULT_TTS_VOICE,
  englishAccents,
  ttsLanguageFor,
  ttsVoices,
  type EnglishAccent,
  type TtsVoiceId,
  type VoiceSource,
} from "@/lib/tts";

type Phase = "setup" | "playing" | "results";
type Feedback = "correct" | "wrong" | null;

function speakWithBrowser(
  word: string,
  locale: string,
  onStart?: () => void,
  onEnd?: () => void,
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = locale;
  utterance.rate = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const prefix = locale.slice(0, 2).toLowerCase();
  const match =
    voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase()) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));
  if (match) utterance.voice = match;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  onStart?.();
  window.speechSynthesis.speak(utterance);
}

export function SpellingPractice() {
  const [lang, setLang] = useState<SpellingLang>("en");
  const [difficulty, setDifficulty] = useState<SpellingDifficulty>("easy");
  const [setSize, setSetSize] = useState<SpellingSetSize>(DEFAULT_SET_SIZE);
  const [accent, setAccent] = useState<EnglishAccent>(DEFAULT_ENGLISH_ACCENT);
  const [voiceId, setVoiceId] = useState<TtsVoiceId>(DEFAULT_TTS_VOICE);
  const [requireAccents, setRequireAccents] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [setWords, setSetWords] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [tried, setTried] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [speechReady, setSpeechReady] = useState(false);
  const [grokAvailable, setGrokAvailable] = useState<boolean | null>(null);
  const [voiceSource, setVoiceSource] = useState<VoiceSource>("grok");
  const [speaking, setSpeaking] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [reshuffledNote, setReshuffledNote] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const voiceSourceRef = useRef<VoiceSource>(voiceSource);

  const list = useMemo(() => getSpellingList(lang), [lang]);
  const bank = useMemo(() => getSpellingBank(lang, difficulty), [lang, difficulty]);
  const word = setWords[wordIndex] ?? "";
  const wordsInBank = bankSize(lang, difficulty);

  useEffect(() => {
    voiceSourceRef.current = voiceSource;
  }, [voiceSource]);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => {
    const markReady = () => setSpeechReady(true);
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    markReady();
    window.speechSynthesis.addEventListener("voiceschanged", markReady);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", markReady);
      stopAudio();
    };
  }, [stopAudio]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/tts")
      .then((res) => res.json())
      .then((data: { available?: boolean }) => {
        if (cancelled) return;
        const available = Boolean(data.available);
        setGrokAvailable(available);
        if (!available) {
          setVoiceSource("browser");
          setVoiceNote((current) =>
            current ?? "Grok voice is not configured. Using the browser voice.",
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGrokAvailable(false);
        setVoiceSource("browser");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const speakWithGrok = useCallback(async (value: string) => {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: value,
        language: ttsLanguageFor(lang, accent),
        voice_id: voiceId,
      }),
    });
    if (!response.ok) {
      throw new Error("tts failed");
    }
    const blob = await response.blob();
    if (!blob.size) throw new Error("empty audio");
    stopAudio();
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    setSpeaking(true);
    audio.onended = () => {
      setSpeaking(false);
      if (objectUrlRef.current === url) {
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
      }
    };
    audio.onerror = () => setSpeaking(false);
    await audio.play();
  }, [accent, lang, stopAudio, voiceId]);

  const hear = useCallback(
    async (value = word) => {
      if (!value) return;
      setVoiceNote(null);
      const locale = browserLocaleFor(lang, accent);
      if (voiceSourceRef.current === "browser") {
        stopAudio();
        speakWithBrowser(
          value,
          locale,
          () => setSpeaking(true),
          () => setSpeaking(false),
        );
        return;
      }
      try {
        await speakWithGrok(value);
      } catch {
        speakWithBrowser(
          value,
          locale,
          () => setSpeaking(true),
          () => setSpeaking(false),
        );
        setVoiceNote("Grok voice unavailable — used the browser voice.");
      }
    },
    [accent, lang, speakWithGrok, stopAudio, word],
  );

  const beginSet = useCallback(
    (nextRemaining: string[], resetScore: boolean) => {
      const dealt = dealSpellingSet(nextRemaining, bank, setSize);
      if (dealt.set.length === 0) return;
      setSetWords(dealt.set);
      setRemaining(dealt.remaining);
      setWordIndex(0);
      setInput("");
      setFeedback(null);
      setPhase("playing");
      busyRef.current = false;
      clearAdvanceTimer();
      setReshuffledNote(
        dealt.reshuffled && nextRemaining.length === 0 && !resetScore
          ? "The word bank was reshuffled for this set."
          : null,
      );
      setScore(0);
      setTried(0);
      setStreak(0);
      if (resetScore) {
        setBestStreak(0);
      }
      const first = dealt.set[0];
      window.setTimeout(() => {
        void hear(first);
        inputRef.current?.focus();
      }, 120);
    },
    [bank, hear, setSize],
  );

  const startSession = useCallback(() => {
    beginSet([], true);
  }, [beginSet]);

  const startNextSet = useCallback(() => {
    beginSet(remaining, false);
  }, [beginSet, remaining]);

  const submit = useCallback(() => {
    if (phase !== "playing" || busyRef.current || !word) return;
    const value = input.trim();
    if (!value) return;

    busyRef.current = true;
    const matched = spellingMatches(
      value,
      word,
      lang === "es" ? requireAccents : true,
    );

    setTried((prev) => prev + 1);
    setFeedback(matched ? "correct" : "wrong");

    if (matched) {
      setScore((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    clearAdvanceTimer();
    advanceTimerRef.current = window.setTimeout(() => {
      const nextIndex = wordIndex + 1;
      if (nextIndex >= setWords.length) {
        busyRef.current = false;
        setPhase("results");
        setFeedback(null);
        return;
      }
      const upcoming = setWords[nextIndex];
      setWordIndex(nextIndex);
      setInput("");
      setFeedback(null);
      busyRef.current = false;
      void hear(upcoming);
    }, matched ? 900 : 1800);
  }, [hear, input, lang, phase, requireAccents, setWords, word, wordIndex]);

  useEffect(() => () => clearAdvanceTimer(), []);

  useEffect(() => {
    if (phase !== "playing" || feedback) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [feedback, phase, word, wordIndex]);

  const accuracy = tried === 0 ? 0 : Math.round((score / tried) * 100);
  const spanishAccentsOff = lang === "es" && !requireAccents;

  return (
    <div className="rounded-2xl border-2 border-line bg-surface p-4 snap-shadow sm:p-6">
      {phase === "setup" ? (
        <div>
          <h2 className="font-display text-2xl text-ink">Choose a language</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Grok reads the word aloud. Headphones help. The word stays hidden
            until you check your spelling. Pick a set size — the bank is much
            larger than one round.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {spellingLists.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={lang === item.id}
                onClick={() => setLang(item.id)}
                className={`rounded-xl border-2 p-3 text-left ${
                  lang === item.id
                    ? "border-secondary bg-secondary-soft"
                    : "border-line bg-bg hover:border-secondary/50"
                }`}
              >
                <span className="block font-semibold text-ink">{item.label}</span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {bankSize(item.id, difficulty)} words in this bank
                </span>
              </button>
            ))}
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-ink">Difficulty</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {spellingDifficulties.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={difficulty === item.id}
                  onClick={() => setDifficulty(item.id)}
                  className={`rounded-xl border-2 p-3 text-left ${
                    difficulty === item.id
                      ? "border-secondary bg-secondary-soft"
                      : "border-line bg-bg hover:border-secondary/50"
                  }`}
                >
                  <span className="block font-semibold text-ink">{item.label}</span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {item.hint} · {bankSize(lang, item.id)} words
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-ink">Words this set</legend>
            <p className="mt-1 text-sm text-ink-muted">
              {wordsInBank} words in the {list.label} {difficulty} bank. A set
              is just this round — use Next set when you finish.
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {spellingSetSizes.map((item) => (
                <button
                  key={String(item.id)}
                  type="button"
                  aria-pressed={setSize === item.id}
                  onClick={() => setSetSize(item.id)}
                  className={`min-h-11 rounded-xl border-2 text-sm font-semibold ${
                    setSize === item.id
                      ? "border-secondary bg-secondary-soft"
                      : "border-line bg-bg hover:border-secondary/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          {lang === "en" ? (
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-ink">English accent</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {englishAccents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={accent === item.id}
                    onClick={() => setAccent(item.id)}
                    className={`rounded-xl border-2 p-3 text-left ${
                      accent === item.id
                        ? "border-secondary bg-secondary-soft"
                        : "border-line bg-bg hover:border-secondary/50"
                    }`}
                  >
                    <span className="block font-semibold text-ink">{item.label}</span>
                    <span className="mt-1 block text-sm text-ink-muted">{item.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {lang === "es" ? (
            <label className="mt-5 flex items-start gap-3 rounded-xl border-2 border-line bg-bg px-3 py-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={requireAccents}
                onChange={(event) => setRequireAccents(event.target.checked)}
              />
              <span>
                <span className="block font-semibold text-ink">Require accent marks</span>
                <span className="mt-0.5 block text-ink-muted">
                  {requireAccents
                    ? "Answers must include accents (áéíóúüñ). Still case-insensitive."
                    : "Accents optional. corazón and corazon both count."}
                </span>
              </span>
            </label>
          ) : null}

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-ink">Voice</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label
                className={`flex min-h-12 items-center gap-2 rounded-xl border-2 px-3 text-sm ${
                  voiceSource === "grok"
                    ? "border-secondary bg-secondary-soft"
                    : "border-line bg-bg"
                } ${grokAvailable === false ? "opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="voice-source"
                  checked={voiceSource === "grok"}
                  disabled={grokAvailable === false}
                  onChange={() => {
                    setVoiceSource("grok");
                    setVoiceNote(null);
                  }}
                />
                Grok voice
              </label>
              <label
                className={`flex min-h-12 items-center gap-2 rounded-xl border-2 px-3 text-sm ${
                  voiceSource === "browser"
                    ? "border-secondary bg-secondary-soft"
                    : "border-line bg-bg"
                }`}
              >
                <input
                  type="radio"
                  name="voice-source"
                  checked={voiceSource === "browser"}
                  onChange={() => {
                    setVoiceSource("browser");
                    setVoiceNote(null);
                  }}
                />
                Browser voice (fallback)
              </label>
            </div>
            {voiceSource === "grok" && grokAvailable !== false ? (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ttsVoices.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={voiceId === item.id}
                    onClick={() => setVoiceId(item.id)}
                    className={`rounded-xl border-2 px-2 py-2 text-left ${
                      voiceId === item.id
                        ? "border-secondary bg-secondary-soft"
                        : "border-line bg-bg hover:border-secondary/50"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">{item.label}</span>
                    <span className="block text-xs text-ink-muted">{item.hint}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </fieldset>

          <button
            type="button"
            onClick={startSession}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink sm:w-auto"
          >
            Start practice
          </button>
          {!speechReady && voiceSource === "browser" ? (
            <p className="mt-3 text-sm text-ink-muted">
              Loading browser voices… tap Start when you are ready.
            </p>
          ) : null}
          {voiceNote ? (
            <p className="mt-3 text-sm text-ink-muted">{voiceNote}</p>
          ) : null}
        </div>
      ) : null}

      {phase === "playing" ? (
        <div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="Score" value={`${score}`} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Streak" value={`${streak}`} />
            <Stat
              label="This set"
              value={`${Math.min(wordIndex + 1, setWords.length)} / ${setWords.length}`}
            />
          </div>

          <div
            className={`mt-6 rounded-2xl border-2 px-4 py-8 text-center sm:px-6 ${
              feedback === "correct"
                ? "animate-pop border-ok bg-ok-soft"
                : feedback === "wrong"
                  ? "animate-shake border-bad bg-bad-soft"
                  : "border-line bg-bg"
            }`}
            aria-live="polite"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              {list.label} · {difficulty === "easy" ? "Easy" : "Challenge"}
            </p>
            <p className="mt-2 font-display text-2xl text-ink">
              Word {wordIndex + 1} of {setWords.length}
            </p>
            <p className="mt-1 text-sm text-ink-muted">Listen, then spell the word</p>
            <p className="mt-3 font-display text-3xl tracking-[0.35em] text-ink-muted">
              {Array.from({ length: Math.max(word.length, 1) }, () => "•").join(
                " ",
              )}
            </p>
            <p className="mt-3 min-h-6 text-sm font-semibold">
              {feedback === "correct"
                ? `Yes — ${word}`
                : feedback === "wrong"
                  ? `Not quite. It is “${word}”.`
                  : speaking
                    ? "Playing the word…"
                    : "The word is hidden until you check."}
            </p>
            {spanishAccentsOff ? (
              <p className="mt-2 text-xs text-ink-muted">Accents optional.</p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => void hear()}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-secondary bg-secondary-soft px-4 text-sm font-semibold text-secondary"
            >
              {speaking ? "Playing…" : "Hear word again"}
            </button>
            {lang === "en" ? (
              <div className="flex gap-2">
                {englishAccents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={accent === item.id}
                    onClick={() => setAccent(item.id)}
                    className={`min-h-11 rounded-xl border-2 px-3 text-sm font-semibold ${
                      accent === item.id
                        ? "border-secondary bg-secondary-soft"
                        : "border-line bg-bg"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={voiceSource === "browser"}
                onChange={(event) => {
                  setVoiceSource(event.target.checked ? "browser" : "grok");
                  setVoiceNote(null);
                }}
                disabled={grokAvailable === false}
              />
              Browser voice (fallback)
            </label>
            {lang === "es" ? (
              <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  checked={requireAccents}
                  onChange={(event) => setRequireAccents(event.target.checked)}
                />
                Require accent marks
              </label>
            ) : null}
          </div>
          {voiceNote ? (
            <p className="mt-2 text-sm text-ink-muted">{voiceNote}</p>
          ) : null}

          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className="block text-sm font-semibold text-ink" htmlFor="spelling-answer">
              Your spelling
            </label>
            <input
              id="spelling-answer"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              disabled={Boolean(feedback)}
              className="mt-2 min-h-12 w-full rounded-xl border-2 border-line bg-bg px-3 text-lg text-ink outline-none focus:border-secondary"
            />
            <button
              type="submit"
              disabled={Boolean(feedback) || input.trim().length === 0}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-50 sm:w-auto"
            >
              Check
            </button>
          </form>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => {
                clearAdvanceTimer();
                stopAudio();
                setPhase("results");
                setFeedback(null);
              }}
              className="min-h-11 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Finish this set
            </button>
          </div>
        </div>
      ) : null}

      {phase === "results" ? (
        <div>
          <h2 className="font-display text-2xl text-ink">Set complete</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {list.label} · {difficulty === "easy" ? "Easy" : "Challenge"} ·{" "}
            {setWords.length} words this set. Best streak {bestStreak}.
            {remaining.length > 0
              ? ` ${remaining.length} words left in this bank before a reshuffle.`
              : " Next set reshuffles the full bank."}
          </p>
          {reshuffledNote ? (
            <p className="mt-2 text-sm text-ink-muted">{reshuffledNote}</p>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Correct" value={`${score}`} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Best streak" value={`${bestStreak}`} />
            <Stat label="Tried" value={`${tried}`} />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={startNextSet}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
            >
              Next set
            </button>
            <button
              type="button"
              onClick={startSession}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-secondary px-4 text-sm font-semibold text-secondary"
            >
              Reshuffle from the start
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}
