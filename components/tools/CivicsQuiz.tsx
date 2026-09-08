"use client";

import { useMemo, useState } from "react";
import {
  civicsQuestions,
  civicsSourceUrl,
  civicsUpdatesUrl,
  getQuizPool,
  shuffle,
  uniqueAnswers,
  type CivicsQuestion,
  type CivicsSection,
} from "@/lib/civics-questions";

type Mode = "quick" | "interview" | "study";
type Phase = "setup" | "playing" | "results";

type Prompt = {
  question: CivicsQuestion;
  options: string[];
  correct: string[];
};

type Recorded = {
  id: number;
  correct: boolean;
  selected: string[];
};

const SECTIONS: CivicsSection[] = [
  "American Government",
  "American History",
  "Symbols and Holidays",
];

function makePrompt(question: CivicsQuestion, pool: CivicsQuestion[]): Prompt {
  const answers = uniqueAnswers(question);
  const correct = shuffle(answers).slice(0, question.need);
  const banned = new Set(answers.map((item) => item.toLowerCase()));
  const distractors: string[] = [];
  for (const other of shuffle(pool)) {
    if (other.id === question.id) continue;
    for (const answer of uniqueAnswers(other)) {
      if (banned.has(answer.toLowerCase())) continue;
      banned.add(answer.toLowerCase());
      distractors.push(answer);
      if (distractors.length >= Math.max(3, question.need + 2)) break;
    }
    if (distractors.length >= Math.max(3, question.need + 2)) break;
  }
  return {
    question,
    correct,
    options: shuffle([...correct, ...distractors.slice(0, Math.max(3, 6 - correct.length))]),
  };
}

function makeRound(mode: Mode): Prompt[] {
  const pool = getQuizPool();
  const count = mode === "interview" ? 20 : 10;
  return shuffle(pool)
    .slice(0, count)
    .map((question) => makePrompt(question, pool));
}

export function CivicsQuiz() {
  const [mode, setMode] = useState<Mode>("quick");
  const [phase, setPhase] = useState<Phase>("setup");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [records, setRecords] = useState<Recorded[]>([]);
  const [section, setSection] = useState<CivicsSection | "all">("all");
  const [query, setQuery] = useState("");

  const current = prompts[index];
  const correctCount = records.filter((item) => item.correct).length;
  const decided =
    mode === "interview" && (correctCount >= 12 || records.length - correctCount >= 9);

  const studyList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return civicsQuestions.filter((item) => {
      if (section !== "all" && item.section !== section) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answers.some((answer) => answer.toLowerCase().includes(q))
      );
    });
  }, [query, section]);

  const start = (nextMode: Mode) => {
    if (nextMode === "study") {
      setMode("study");
      setPhase("setup");
      return;
    }
    setMode(nextMode);
    setPrompts(makeRound(nextMode));
    setIndex(0);
    setSelected([]);
    setFeedback(null);
    setRecords([]);
    setPhase("playing");
  };

  const toggleChoice = (option: string) => {
    if (feedback || !current) return;
    setSelected((prev) => {
      if (prev.includes(option)) return prev.filter((item) => item !== option);
      if (prev.length >= current.question.need) {
        return [...prev.slice(1), option];
      }
      return [...prev, option];
    });
  };

  const check = () => {
    if (!current || feedback) return;
    if (selected.length !== current.question.need) return;
    const ok = selected.every((item) => current.correct.includes(item));
    setFeedback(ok ? "correct" : "wrong");
    setRecords((prev) => [
      ...prev,
      { id: current.question.id, correct: ok, selected },
    ]);
  };

  const advance = () => {
    const nextIndex = index + 1;
    const nextRecords = records.length;
    const nextCorrect = records.filter((item) => item.correct).length;
    const interviewDone =
      mode === "interview" && (nextCorrect >= 12 || nextRecords - nextCorrect >= 9);
    if (nextIndex >= prompts.length || interviewDone) {
      setPhase("results");
      setFeedback(null);
      return;
    }
    setIndex(nextIndex);
    setSelected([]);
    setFeedback(null);
  };

  const passed =
    mode === "interview" ? correctCount >= 12 : correctCount >= Math.ceil(records.length * 0.6);

  return (
    <div className="rounded-2xl border-2 border-line bg-surface p-4 snap-shadow sm:p-6">
      <aside className="no-print rounded-xl border-2 border-secondary bg-secondary-soft/80 px-4 py-3 text-sm text-ink">
        <p className="font-bold text-secondary-ink">
          Typed practice — the real test is oral
        </p>
        <p className="mt-1 text-ink-muted">
          A USCIS officer asks up to 20 questions from this 128-question bank
          and you answer out loud. You pass at 12 correct (or fail at 9 wrong).
          This page is a typed study tool, not the interview.
        </p>
        <p className="mt-2 text-ink-muted">
          Official source:{" "}
          <a
            href={civicsSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-secondary-strong underline"
          >
            USCIS 2025 civics test
          </a>
          . Current-office names can change —{" "}
          <a
            href={civicsUpdatesUrl}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-secondary-strong underline"
          >
            check test updates
          </a>
          .
        </p>
      </aside>

      {phase === "setup" && mode !== "study" ? (
        <div className="no-print mt-5">
          <h2 className="font-display text-2xl text-ink">Choose a mode</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ModeChoice
              title="Quick 10"
              detail="Ten random questions. Instant feedback."
              active={mode === "quick"}
              onClick={() => setMode("quick")}
            />
            <ModeChoice
              title="Interview 20"
              detail="Twenty questions. Pass at 12, like the 2025 test."
              active={mode === "interview"}
              onClick={() => setMode("interview")}
            />
            <ModeChoice
              title="Study browse"
              detail="All 128 official questions and accepted answers."
              active={false}
              onClick={() => start("study")}
            />
          </div>
          <button
            type="button"
            onClick={() => start(mode)}
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-base font-bold text-accent-ink hover:brightness-110"
          >
            Start {mode === "interview" ? "interview practice" : "quick quiz"}
          </button>
        </div>
      ) : null}

      {mode === "study" ? (
        <div className="mt-5">
          <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex-1 text-sm font-semibold text-ink">
              Search
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-line bg-bg px-3 py-2 font-normal outline-none focus:border-accent"
                placeholder="Question or answer"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="All"
                active={section === "all"}
                onClick={() => setSection("all")}
              />
              {SECTIONS.map((item) => (
                <FilterChip
                  key={item}
                  label={item}
                  active={section === item}
                  onClick={() => setSection(item)}
                />
              ))}
            </div>
          </div>
          <p className="no-print mt-3 text-sm text-ink-muted">
            Showing {studyList.length} of {civicsQuestions.length} questions.
          </p>
          <ol className="mt-4 space-y-4">
            {studyList.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border-2 border-line bg-bg px-4 py-3"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-accent">
                  {item.id}
                  {item.special65 ? " · 65/20" : ""}
                  {item.varies ? " · answers vary" : ""}
                  {item.currentOfficial ? " · check updates" : ""}
                </p>
                <h3 className="mt-1 font-semibold text-ink">{item.question}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                  {uniqueAnswers(item).map((answer) => (
                    <li key={answer}>{answer}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => {
              setMode("quick");
              setPhase("setup");
            }}
            className="no-print mt-5 inline-flex min-h-11 items-center text-sm font-bold text-secondary-strong"
          >
            Back to quiz modes
          </button>
        </div>
      ) : null}

      {phase === "playing" && current ? (
        <div className="no-print mt-5">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Question" value={`${index + 1}/${prompts.length}`} />
            <Stat label="Correct" value={`${correctCount}`} />
            <Stat
              label={mode === "interview" ? "To pass" : "Tried"}
              value={mode === "interview" ? "12" : `${records.length}`}
            />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-secondary-strong">
            Q{current.question.id} · {current.question.section}
            {current.question.need > 1 ? ` · pick ${current.question.need}` : ""}
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            {current.question.question}
          </h2>
          {current.question.currentOfficial ? (
            <p className="mt-2 text-sm text-ink-muted">
              Officeholders change. Confirm at USCIS test updates before an
              interview.
            </p>
          ) : null}
          <div className="mt-4 grid gap-2">
            {current.options.map((option) => {
              const isOn = selected.includes(option);
              const showCorrect =
                feedback && current.correct.includes(option);
              const showWrong =
                feedback === "wrong" && isOn && !current.correct.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleChoice(option)}
                  aria-pressed={isOn}
                  className={`min-h-12 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold ${
                    showCorrect
                      ? "border-ok bg-ok-soft"
                      : showWrong
                        ? "border-bad bg-bad-soft"
                        : isOn
                          ? "border-accent bg-accent-soft"
                          : "border-line bg-bg hover:border-accent/50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {feedback ? (
            <div
              className={`mt-4 rounded-xl border-2 px-3 py-3 text-sm ${
                feedback === "correct"
                  ? "border-ok bg-ok-soft"
                  : "border-bad bg-bad-soft"
              }`}
            >
              <p className="font-bold">
                {feedback === "correct" ? "Correct" : "Not quite"}
              </p>
              <p className="mt-1 text-ink-muted">Accepted answers include:</p>
              <ul className="mt-1 list-disc pl-5 text-ink">
                {uniqueAnswers(current.question)
                  .slice(0, 8)
                  .map((answer) => (
                    <li key={answer}>{answer}</li>
                  ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {!feedback ? (
              <button
                type="button"
                onClick={check}
                disabled={selected.length !== current.question.need}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-ink hover:brightness-110 disabled:opacity-50"
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-ink hover:brightness-110"
              >
                {index + 1 >= prompts.length || decided
                  ? "See results"
                  : "Next question"}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {phase === "results" ? (
        <div className="no-print mt-5">
          <h2 className="font-display text-2xl text-ink">
            {mode === "interview"
              ? passed
                ? "Pass — 12 or more correct"
                : "Keep studying — need 12 of 20"
              : "Round complete"}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {correctCount} correct out of {records.length}. The interview is
            spoken; use Study browse to read every accepted answer.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Correct" value={`${correctCount}`} />
            <Stat label="Asked" value={`${records.length}`} />
            <Stat
              label="Accuracy"
              value={`${
                records.length === 0
                  ? 0
                  : Math.round((correctCount / records.length) * 100)
              }%`}
            />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => start(mode)}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-ink hover:brightness-110"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => start("study")}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-ink"
            >
              Browse all 128
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("quick");
                setPhase("setup");
              }}
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

function FilterChip({
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
      className={`min-h-10 rounded-full px-3 text-sm font-bold ${
        active
          ? "bg-secondary text-secondary-ink"
          : "border-2 border-line bg-bg text-ink"
      }`}
    >
      {label}
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
