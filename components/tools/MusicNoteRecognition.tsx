"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

type NoteName = "C" | "D" | "E" | "F" | "G" | "A" | "B";
type Mode = "practice" | "streak";
type Phase = "setup" | "playing" | "results";
type Range = "lines" | "all";
type Feedback = "correct" | "wrong" | null;

type StaffNote = {
  id: string;
  name: NoteName;
  /** 0 = middle C (C4). Each step is one line or space. */
  step: number;
  kind: "line" | "space";
  ledger: boolean;
};

type NoteRecord = {
  id: string;
  name: NoteName;
  ms: number;
  correct: boolean;
};

const NOTE_NAMES: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"];

const STAFF_NOTES: StaffNote[] = [
  { id: "C4", name: "C", step: 0, kind: "line", ledger: true },
  { id: "D4", name: "D", step: 1, kind: "space", ledger: true },
  { id: "E4", name: "E", step: 2, kind: "line", ledger: false },
  { id: "F4", name: "F", step: 3, kind: "space", ledger: false },
  { id: "G4", name: "G", step: 4, kind: "line", ledger: false },
  { id: "A4", name: "A", step: 5, kind: "space", ledger: false },
  { id: "B4", name: "B", step: 6, kind: "line", ledger: false },
  { id: "C5", name: "C", step: 7, kind: "space", ledger: false },
  { id: "D5", name: "D", step: 8, kind: "line", ledger: false },
  { id: "E5", name: "E", step: 9, kind: "space", ledger: false },
  { id: "F5", name: "F", step: 10, kind: "line", ledger: false },
  { id: "G5", name: "G", step: 11, kind: "space", ledger: true },
  { id: "A5", name: "A", step: 12, kind: "line", ledger: true },
];

const FALLBACK_NOTE = STAFF_NOTES[2];

function notePool(range: Range, includeLedger: boolean): StaffNote[] {
  return STAFF_NOTES.filter((note) => {
    if (note.ledger && !includeLedger) return false;
    if (range === "lines" && note.kind !== "line") return false;
    return true;
  });
}

function nextNote(pool: StaffNote[], last: StaffNote | null): StaffNote {
  if (pool.length === 0) return FALLBACK_NOTE;
  let pick = pool[Math.floor(Math.random() * pool.length)];
  for (let i = 0; i < 8 && last && pool.length > 1; i += 1) {
    if (pick.id !== last.id) break;
    pick = pool[Math.floor(Math.random() * pool.length)];
  }
  return pick;
}

function uniqueMissed(records: NoteRecord[]) {
  const seen = new Set<string>();
  return records
    .filter((item) => !item.correct)
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

export function MusicNoteRecognition() {
  const [range, setRange] = useState<Range>("lines");
  const [includeLedger, setIncludeLedger] = useState(false);
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [note, setNote] = useState<StaffNote>(FALLBACK_NOTE);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [records, setRecords] = useState<NoteRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const shownAtRef = useRef(0);
  const phaseRef = useRef(phase);
  const endingRef = useRef(false);
  const busyRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const playPanelRef = useRef<HTMLDivElement>(null);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const pool = useMemo(
    () => notePool(range, includeLedger),
    [includeLedger, range],
  );

  const stats = useMemo(() => {
    const attempted = records.length;
    const correct = records.filter((item) => item.correct).length;
    const missed = uniqueMissed(records);
    const accuracy =
      attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
    return { attempted, correct, missed, accuracy };
  }, [records]);

  const startSession = useCallback(() => {
    const selected = pool.length > 0 ? pool : notePool("lines", false);
    const first = nextNote(selected, null);
    setNote(first);
    setFeedback(null);
    setRecords([]);
    setStreak(0);
    setBestStreak(0);
    setPhase("playing");
    endingRef.current = false;
    busyRef.current = false;
    clearAdvanceTimer();
    shownAtRef.current = Date.now();
    window.setTimeout(() => playPanelRef.current?.focus(), 0);
  }, [pool]);

  const finishSession = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    setPhase("results");
    setFeedback(null);
  }, []);

  const submitAnswer = useCallback(
    (raw: string) => {
      if (phaseRef.current !== "playing" || busyRef.current) return;
      const value = raw.trim().toUpperCase();
      if (!NOTE_NAMES.includes(value as NoteName)) return;

      busyRef.current = true;
      const correct = value === note.name;
      const ms = Date.now() - shownAtRef.current;
      const record: NoteRecord = { id: note.id, name: note.name, ms, correct };

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
        const upcoming = nextNote(pool, note);
        setNote(upcoming);
        setFeedback(null);
        shownAtRef.current = Date.now();
        busyRef.current = false;
      }, delay);
    },
    [finishSession, mode, note, pool],
  );

  useEffect(() => () => clearAdvanceTimer(), []);

  useEffect(() => {
    if (phase !== "playing") return;

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (busyRef.current || feedback) return;
      const letter = event.key.toUpperCase();
      if (NOTE_NAMES.includes(letter as NoteName)) {
        event.preventDefault();
        submitAnswer(letter);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedback, phase, submitAnswer]);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 snap-shadow sm:p-6">
      {phase === "setup" ? (
        <SetupPanel
          range={range}
          includeLedger={includeLedger}
          mode={mode}
          onRange={setRange}
          onLedger={setIncludeLedger}
          onMode={setMode}
          onStart={startSession}
        />
      ) : null}

      {phase === "playing" ? (
        <PlayPanel
          panelRef={playPanelRef}
          mode={mode}
          note={note}
          feedback={feedback}
          streak={streak}
          stats={stats}
          onGuess={submitAnswer}
          onFinish={finishSession}
        />
      ) : null}

      {phase === "results" ? (
        <ResultsPanel
          mode={mode}
          stats={stats}
          bestStreak={bestStreak}
          onAgain={startSession}
          onSetup={() => setPhase("setup")}
        />
      ) : null}
    </div>
  );
}

function SetupPanel({
  range,
  includeLedger,
  mode,
  onRange,
  onLedger,
  onMode,
  onStart,
}: {
  range: Range;
  includeLedger: boolean;
  mode: Mode;
  onRange: (range: Range) => void;
  onLedger: (value: boolean) => void;
  onMode: (mode: Mode) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose notes</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Treble staff only. Start on the lines, then add spaces when those feel
        automatic.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ModeButton
          title="Lines only"
          detail="E G B D F — Every Good Boy Does Fine"
          active={range === "lines"}
          onClick={() => onRange("lines")}
        />
        <ModeButton
          title="Lines + spaces"
          detail="Staff notes, including FACE in the spaces"
          active={range === "all"}
          onClick={() => onRange("all")}
        />
      </div>

      <label className="mt-4 flex min-h-11 items-start gap-3 rounded-xl border border-line bg-bg px-3 py-3 text-sm text-ink">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--accent)]"
          checked={includeLedger}
          onChange={(event) => onLedger(event.target.checked)}
        />
        <span>
          <span className="font-semibold">Include ledger lines</span>
          <span className="mt-0.5 block text-ink-muted">
            Adds middle C and the notes just above and below the staff.
          </span>
        </span>
      </label>

      <h3 className="mt-6 font-display text-xl text-ink">Mode</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ModeButton
          title="Practice"
          detail="Untimed. Stop whenever you like."
          active={mode === "practice"}
          onClick={() => onMode("practice")}
        />
        <ModeButton
          title="Streak"
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
  panelRef,
  mode,
  note,
  feedback,
  streak,
  stats,
  onGuess,
  onFinish,
}: {
  panelRef: RefObject<HTMLDivElement | null>;
  mode: Mode;
  note: StaffNote;
  feedback: Feedback;
  streak: number;
  stats: { attempted: number; correct: number; accuracy: number };
  onGuess: (name: string) => void;
  onFinish: () => void;
}) {
  const prompt =
    feedback === "correct"
      ? `Yes! That is ${note.name}.`
      : feedback === "wrong"
        ? `Not quite. That is ${note.name}.`
        : "Tap a letter or type C D E F G A B";

  return (
    <div ref={panelRef} tabIndex={-1} className="outline-none">
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Score" value={`${stats.correct}`} />
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Streak" value={`${streak}`} />
        <Stat label="Tried" value={`${stats.attempted}`} />
      </div>

      <div
        className={`mt-6 rounded-2xl border px-3 py-4 sm:px-5 ${
          feedback === "correct"
            ? "animate-pop border-ok bg-ok-soft"
            : feedback === "wrong"
              ? "animate-shake border-bad bg-bad-soft"
              : "border-line bg-bg"
        }`}
      >
        <TrebleStaff note={note} feedback={feedback} />
        <p
          className={`mt-3 min-h-6 text-center text-sm font-semibold ${
            feedback === "correct"
              ? "text-ok"
              : feedback === "wrong"
                ? "text-bad"
                : "font-medium text-ink-muted"
          }`}
          aria-live="polite"
        >
          {prompt}
        </p>
      </div>

      <div
        role="group"
        aria-label="Note names"
        className="mx-auto mt-5 grid max-w-lg grid-cols-4 gap-2 sm:grid-cols-7"
      >
        {NOTE_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onGuess(name)}
            disabled={Boolean(feedback)}
            aria-label={`Note ${name}`}
            className="min-h-14 touch-manipulation rounded-xl border border-line bg-bg text-lg font-semibold text-ink hover:border-accent/50 disabled:opacity-60"
          >
            {name}
          </button>
        ))}
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
  onSetup,
}: {
  mode: Mode;
  stats: {
    attempted: number;
    correct: number;
    accuracy: number;
    missed: NoteRecord[];
  };
  bestStreak: number;
  onAgain: () => void;
  onSetup: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Nice work</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {mode === "streak"
          ? "Streak ended on a miss — those notes are the ones to keep."
          : "Here’s what this round looked like."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Correct" value={`${stats.correct}`} />
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Best streak" value={`${bestStreak}`} />
        <Stat label="Tried" value={`${stats.attempted}`} />
      </div>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-ink">Missed notes</h3>
        {stats.missed.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">
            No misses. That’s the goal.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {stats.missed.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-line bg-bg px-2.5 py-1 text-sm"
              >
                {item.name}
                <span className="text-ink-muted"> ({item.id})</span>
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
          Change notes
        </button>
      </div>
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

const STAFF_TOP = 48;
const STAFF_GAP = 16;
const NOTE_X = 248;

function stepToY(step: number) {
  return STAFF_TOP + (10 - step) * (STAFF_GAP / 2);
}

function TrebleStaff({
  note,
  feedback,
}: {
  note: StaffNote;
  feedback: Feedback;
}) {
  const y = stepToY(note.step);
  const stemUp = note.step < 6;
  const noteFill =
    feedback === "correct"
      ? "var(--ok)"
      : feedback === "wrong"
        ? "var(--bad)"
        : "var(--ink)";

  const ledgerSteps = ledgerStepsFor(note.step);

  return (
    <svg
      viewBox="0 0 400 176"
      role="img"
      aria-label={
        feedback
          ? `Treble staff. The note is ${note.name}.`
          : "A note is shown on the treble staff. Choose its letter name."
      }
      className="mx-auto block h-auto w-full max-w-xl text-ink"
    >
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={line}
          x1="28"
          x2="372"
          y1={STAFF_TOP + line * STAFF_GAP}
          y2={STAFF_TOP + line * STAFF_GAP}
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.85"
        />
      ))}

      <TrebleClef />

      {ledgerSteps.map((step) => {
        const ledgerY = stepToY(step);
        return (
          <line
            key={step}
            x1={NOTE_X - 22}
            x2={NOTE_X + 22}
            y1={ledgerY}
            y2={ledgerY}
            stroke="currentColor"
            strokeWidth="1.6"
          />
        );
      })}

      <ellipse
        cx={NOTE_X}
        cy={y}
        rx="12"
        ry="8.5"
        transform={`rotate(-20 ${NOTE_X} ${y})`}
        fill={noteFill}
      />

      {stemUp ? (
        <line
          x1={NOTE_X + 10}
          x2={NOTE_X + 10}
          y1={y - 1}
          y2={y - 46}
          stroke={noteFill}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : (
        <line
          x1={NOTE_X - 10}
          x2={NOTE_X - 10}
          y1={y + 1}
          y2={y + 46}
          stroke={noteFill}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function ledgerStepsFor(step: number) {
  const steps: number[] = [];
  if (step <= 0) {
    for (let s = 0; s >= step; s -= 2) steps.push(s);
  }
  if (step >= 12) {
    for (let s = 12; s <= step; s += 2) steps.push(s);
  }
  return steps;
}

/** Public-domain G-clef from Wikimedia Commons File:GClef.svg. */
const TREBLE_CLEF_PATH =
  "m12.049 3.5296c0.305 3.1263-2.019 5.6563-4.0772 7.7014-0.9349 0.897-0.155 0.148-0.6437 0.594-0.1022-0.479-0.2986-1.731-0.2802-2.11 0.1304-2.6939 2.3198-6.5875 4.2381-8.0236 0.309 0.5767 0.563 0.6231 0.763 1.8382zm0.651 16.142c-1.232-0.906-2.85-1.144-4.3336-0.885-0.1913-1.255-0.3827-2.51-0.574-3.764 2.3506-2.329 4.9066-5.0322 5.0406-8.5394 0.059-2.232-0.276-4.6714-1.678-6.4836-1.7004 0.12823-2.8995 2.156-3.8019 3.4165-1.4889 2.6705-1.1414 5.9169-0.57 8.7965-0.8094 0.952-1.9296 1.743-2.7274 2.734-2.3561 2.308-4.4085 5.43-4.0046 8.878 0.18332 3.334 2.5894 6.434 5.8702 7.227 1.2457 0.315 2.5639 0.346 3.8241 0.099 0.2199 2.25 1.0266 4.629 0.0925 6.813-0.7007 1.598-2.7875 3.004-4.3325 2.192-0.5994-0.316-0.1137-0.051-0.478-0.252 1.0698-0.257 1.9996-1.036 2.26-1.565 0.8378-1.464-0.3998-3.639-2.1554-3.358-2.262 0.046-3.1904 3.14-1.7356 4.685 1.3468 1.52 3.833 1.312 5.4301 0.318 1.8125-1.18 2.0395-3.544 1.8325-5.562-0.07-0.678-0.403-2.67-0.444-3.387 0.697-0.249 0.209-0.059 1.193-0.449 2.66-1.053 4.357-4.259 3.594-7.122-0.318-1.469-1.044-2.914-2.302-3.792zm0.561 5.757c0.214 1.991-1.053 4.321-3.079 4.96-0.136-0.795-0.172-1.011-0.2626-1.475-0.4822-2.46-0.744-4.987-1.116-7.481 1.6246-0.168 3.4576 0.543 4.0226 2.184 0.244 0.577 0.343 1.197 0.435 1.812zm-5.1486 5.196c-2.5441 0.141-4.9995-1.595-5.6343-4.081-0.749-2.153-0.5283-4.63 0.8207-6.504 1.1151-1.702 2.6065-3.105 4.0286-4.543 0.183 1.127 0.366 2.254 0.549 3.382-2.9906 0.782-5.0046 4.725-3.215 7.451 0.5324 0.764 1.9765 2.223 2.7655 1.634-1.102-0.683-2.0033-1.859-1.8095-3.227-0.0821-1.282 1.3699-2.911 2.6513-3.198 0.4384 2.869 0.9413 6.073 1.3797 8.943-0.5054 0.1-1.0211 0.143-1.536 0.143z";

function TrebleClef() {
  // Native viewBox is 15.186 × 40.768. The G spiral sits near y=25.4 and must
  // land on G4 (second staff line from the bottom). Keep nonzero fill — evenodd
  // collapses this outline into solid blobs.
  const nativeW = 15.186;
  const nativeH = 40.768;
  const nativeG = 25.4;
  const scale = 2.85;
  const g4 = stepToY(4);
  const x = 30;
  const y = g4 - nativeG * scale;

  return (
    <svg
      x={x}
      y={y}
      width={nativeW * scale}
      height={nativeH * scale}
      viewBox={`0 0 ${nativeW} ${nativeH}`}
      overflow="visible"
      aria-hidden
    >
      <path d={TREBLE_CLEF_PATH} fill="currentColor" />
    </svg>
  );
}
