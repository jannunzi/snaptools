"use client";

import { useMemo, useState } from "react";
import {
  USCIS_CIVICS_PAGE,
  USCIS_CIVICS_SOURCE,
  USCIS_TEST_UPDATES,
  civicsQuestions,
  type CivicsQuestion,
} from "@/lib/civics-2025";

type Mode = "quick" | "interview" | "browse";
type Phase = "setup" | "playing" | "results";

type AskItem = {
  question: CivicsQuestion;
  promptAnswers: string[];
  options: string[];
};

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickN<T>(items: T[], count: number) {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

const quizPool = civicsQuestions.filter((item) => !item.variable);
const distractorPool = quizPool.flatMap((item) => item.answers);

function buildAsk(question: CivicsQuestion): AskItem {
  const need = question.need;
  const promptAnswers = pickN(question.answers, need);
  const wrong = distractorPool.filter(
    (answer) => !question.answers.includes(answer),
  );
  const extraOfficial =
    need === 1
      ? []
      : question.answers.filter((answer) => !promptAnswers.includes(answer));
  const fillerCount = need === 1 ? 3 : Math.max(3, need);
  const options = shuffle([
    ...promptAnswers,
    ...pickN(extraOfficial, need === 1 ? 0 : 2),
    ...pickN(wrong, fillerCount),
  ]).slice(0, need === 1 ? 4 : need + fillerCount);
  return { question, promptAnswers, options };
}

function deal(count: number) {
  return pickN(quizPool, count).map(buildAsk);
}

export function CivicsQuiz() {
  const [mode, setMode] = useState<Mode>("quick");
  const [phase, setPhase] = useState<Phase>("setup");
  const [deck, setDeck] = useState<AskItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [browseQuery, setBrowseQuery] = useState("");
  const [openNum, setOpenNum] = useState<number | null>(1);

  const current = deck[index];
  const target = mode === "interview" ? 20 : 10;
  const need = current?.question.need ?? 1;
  const passed =
    mode === "interview" ? correctCount >= 12 : correctCount >= Math.ceil(target * 0.6);

  const filteredBrowse = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    if (!q) return civicsQuestions;
    return civicsQuestions.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answers.some((answer) => answer.toLowerCase().includes(q)) ||
        item.section.toLowerCase().includes(q) ||
        String(item.num) === q,
    );
  }, [browseQuery]);

  const start = (nextMode: Mode) => {
    setMode(nextMode);
    if (nextMode === "browse") {
      setPhase("setup");
      return;
    }
    setDeck(deal(nextMode === "interview" ? 20 : 10));
    setIndex(0);
    setSelected([]);
    setFeedback(null);
    setCorrectCount(0);
    setWrongCount(0);
    setPhase("playing");
  };

  const toggleOption = (option: string) => {
    if (feedback) return;
    setSelected((prev) => {
      if (need === 1) return [option];
      if (prev.includes(option)) return prev.filter((item) => item !== option);
      if (prev.length >= need) return [...prev.slice(1), option];
      return [...prev, option];
    });
  };

  const grade = () => {
    if (!current || feedback) return;
    if (selected.length !== need) return;
    const official = new Set(current.question.answers);
    const ok = selected.every((item) => official.has(item));
    setFeedback(ok ? "correct" : "wrong");
    if (ok) setCorrectCount((prev) => prev + 1);
    else setWrongCount((prev) => prev + 1);
  };

  const advance = () => {
    if (!current) return;
    const nextCorrect = correctCount;
    const nextWrong = wrongCount;
    const interviewDone =
      mode === "interview" && (nextCorrect >= 12 || nextWrong >= 9);
    const lastCard = index + 1 >= deck.length;
    if (interviewDone || lastCard) {
      setPhase("results");
      setFeedback(null);
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected([]);
    setFeedback(null);
  };

  return (
    <div className="rounded-2xl border-2 border-line bg-surface p-4 snap-shadow sm:p-6">
      <aside className="rounded-xl border border-secondary/40 bg-secondary-soft/70 px-4 py-3 text-sm text-ink">
        <p className="font-semibold text-secondary">USCIS 2025 civics test</p>
        <p className="mt-1 text-ink">
          Official public questions and answers from{" "}
          <a
            href={USCIS_CIVICS_SOURCE}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline"
          >
            M-1778 (128 questions)
          </a>
          . Interview rule: 20 asked, pass with 12 correct. Officeholders can
          change —{" "}
          <a
            href={USCIS_TEST_UPDATES}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline"
          >
            check test updates
          </a>
          . Not affiliated with{" "}
          <a
            href={USCIS_CIVICS_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline"
          >
            USCIS
          </a>
          .
        </p>
      </aside>

      {phase === "setup" ? (
        <div className="mt-6">
          <h2 className="font-display text-2xl text-ink">Choose a mode</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <ModeButton
              title="Quick 10"
              detail="Ten random questions. Any official answer counts."
              active={mode === "quick"}
              onClick={() => setMode("quick")}
            />
            <ModeButton
              title="Interview 20"
              detail="Pass with 12 correct. Stops at 12 right or 9 wrong."
              active={mode === "interview"}
              onClick={() => setMode("interview")}
            />
            <ModeButton
              title="Browse"
              detail="Read all 128 questions and official answers."
              active={mode === "browse"}
              onClick={() => setMode("browse")}
            />
          </div>
          {mode !== "browse" ? (
            <button
              type="button"
              onClick={() => start(mode)}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink sm:w-auto"
            >
              Start {mode === "interview" ? "interview" : "quick 10"}
            </button>
          ) : null}

          {mode === "browse" ? (
            <BrowsePanel
              query={browseQuery}
              onQuery={setBrowseQuery}
              items={filteredBrowse}
              openNum={openNum}
              onOpen={setOpenNum}
            />
          ) : null}
        </div>
      ) : null}

      {phase === "playing" && current ? (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="Question" value={`${index + 1} / ${deck.length}`} />
            <Stat label="Correct" value={`${correctCount}`} />
            <Stat label="Wrong" value={`${wrongCount}`} />
            <Stat
              label={mode === "interview" ? "Pass at" : "Tried"}
              value={mode === "interview" ? "12" : `${correctCount + wrongCount}`}
            />
          </div>

          <div
            className={`mt-5 rounded-2xl border-2 px-4 py-5 ${
              feedback === "correct"
                ? "animate-pop border-ok bg-ok-soft"
                : feedback === "wrong"
                  ? "animate-shake border-bad bg-bad-soft"
                  : "border-line bg-bg"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              {current.question.starred ? "★ 65/20 · " : ""}
              {current.question.section}
            </p>
            <h3 className="mt-2 font-display text-2xl text-ink">
              {current.question.num}. {current.question.question}
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              {need === 1
                ? "Choose one official answer."
                : `Choose ${need} official answers.`}
              {current.question.officeholder
                ? " Confirm the current name at USCIS before interview day."
                : ""}
            </p>
            <div className="mt-4 grid gap-2">
              {current.options.map((option) => {
                const isOn = selected.includes(option);
                const official = current.question.answers.includes(option);
                const showKey = Boolean(feedback);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    aria-pressed={isOn}
                    className={`min-h-12 rounded-xl border-2 px-3 py-2 text-left text-sm font-medium ${
                      showKey && official
                        ? "border-ok bg-ok-soft text-ink"
                        : showKey && isOn && !official
                          ? "border-bad bg-bad-soft text-ink"
                          : isOn
                            ? "border-secondary bg-secondary-soft text-ink"
                            : "border-line bg-surface text-ink hover:border-secondary/50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 min-h-6 text-sm font-semibold" aria-live="polite">
              {feedback === "correct"
                ? "Correct."
                : feedback === "wrong"
                  ? `Accepted answers: ${current.question.answers.join(" · ")}`
                  : ""}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {feedback ? (
              <button
                type="button"
                onClick={advance}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
              >
                {index + 1 >= deck.length ? "See results" : "Next"}
              </button>
            ) : (
              <button
                type="button"
                onClick={grade}
                disabled={selected.length !== need}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-50"
              >
                Check
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPhase("results");
                setFeedback(null);
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              End early
            </button>
          </div>
        </div>
      ) : null}

      {phase === "results" ? (
        <div className="mt-6">
          <h2 className="font-display text-2xl text-ink">
            {mode === "interview"
              ? passed
                ? "Pass"
                : "Keep studying"
              : "Round over"}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {mode === "interview"
              ? passed
                ? "You reached 12 correct — the 2025 interview pass mark."
                : "The 2025 interview needs 12 correct before 9 misses."
              : `${correctCount} correct in this quick set.`}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Correct" value={`${correctCount}`} />
            <Stat label="Wrong" value={`${wrongCount}`} />
            <Stat
              label="Asked"
              value={`${correctCount + wrongCount}`}
            />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => start(mode === "browse" ? "quick" : mode)}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
            >
              Practice again
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase("setup");
                setMode("browse");
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-secondary px-4 text-sm font-semibold text-secondary"
            >
              Browse the bank
            </button>
            <button
              type="button"
              onClick={() => setPhase("setup")}
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Change mode
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BrowsePanel({
  query,
  onQuery,
  items,
  openNum,
  onOpen,
}: {
  query: string;
  onQuery: (value: string) => void;
  items: CivicsQuestion[];
  openNum: number | null;
  onOpen: (num: number | null) => void;
}) {
  return (
    <div className="mt-6">
      <label className="text-sm font-semibold text-ink" htmlFor="civics-search">
        Search the 128-question bank
      </label>
      <input
        id="civics-search"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Question, answer, or number"
        className="mt-2 min-h-12 w-full rounded-xl border-2 border-line bg-bg px-3 text-ink outline-none focus:border-secondary"
      />
      <p className="mt-2 text-sm text-ink-muted">{items.length} questions</p>
      <ol className="mt-3 space-y-2">
        {items.map((item) => {
          const open = openNum === item.num;
          return (
            <li key={item.num} className="rounded-xl border border-line bg-bg">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
                onClick={() => onOpen(open ? null : item.num)}
                aria-expanded={open}
              >
                <span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                    {item.starred ? "★ " : ""}
                    {item.num}
                    {item.variable ? " · varies by state" : ""}
                    {item.officeholder ? " · check USCIS" : ""}
                  </span>
                  <span className="mt-1 block font-medium text-ink">
                    {item.question}
                  </span>
                </span>
                <span className="text-sm text-secondary">{open ? "Hide" : "Show"}</span>
              </button>
              {open ? (
                <ul className="border-t border-line px-3 py-3 text-sm text-ink">
                  {item.answers.map((answer) => (
                    <li key={answer} className="mt-1 first:mt-0">
                      • {answer}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
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
      className={`rounded-xl border-2 p-3 text-left ${
        active
          ? "border-secondary bg-secondary-soft"
          : "border-line bg-bg hover:border-secondary/40"
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
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}
