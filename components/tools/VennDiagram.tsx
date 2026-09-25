"use client";

import { useCallback, useEffect, useId, useState, type KeyboardEvent } from "react";
import { MathLabFrame, useMathLabProjector } from "@/components/labs/MathLabFrame";
import {
  DEFAULT_COUNTS_2,
  DIAGRAM_2,
  WORD_PROBLEMS,
  defaultCounts,
  diagramFor,
  draftFromSolution,
  emptyDraft,
  expressionChoices,
  formatSubstitution,
  formulaFor,
  gradeProblem,
  matchExpression,
  regionName,
  regionSpoken,
  regionsFor,
  regionsOf,
  type Counts,
  type Diagram,
  type DiagramCircle,
  type ExpressionId,
  type LabMode,
  type RegionId,
  type SetCount,
  type WordProblem,
} from "@/lib/venn-diagram";

const SHADED = "color-mix(in srgb, var(--secondary) 30%, var(--surface))";
const FOCUS_WASH = "color-mix(in srgb, var(--secondary) 58%, var(--surface))";

function pillClass(active: boolean) {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-3.5 text-sm font-semibold ${
    active ? "border-ink bg-accent text-accent-ink" : "border-line bg-surface text-ink hover:border-ink"
  }`;
}

function cap(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function digitsOnly(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 3);
}

function plainName(id: RegionId, sets: SetCount, problem: WordProblem | null) {
  if (!problem) return regionName(id, sets);
  const a = problem.labels.A;
  const b = problem.labels.B;
  const c = problem.labels.C ?? "C";
  switch (id) {
    case "onlyA":
      return `Only ${a}`;
    case "onlyB":
      return `Only ${b}`;
    case "onlyC":
      return `Only ${c}`;
    case "ab":
      return sets === 2 ? `${cap(a)} and ${b}` : `${cap(a)} and ${b}, not ${c}`;
    case "bc":
      return `${cap(b)} and ${c}, not ${a}`;
    case "ca":
      return `${cap(c)} and ${a}, not ${b}`;
    case "abc":
      return "All three";
    case "outside":
      return "Neither";
    default: {
      const never: never = id;
      return never;
    }
  }
}

function circleCaption(circle: DiagramCircle, problem: WordProblem | null) {
  if (!problem) return circle.id;
  if (circle.id === "A") return cap(problem.labels.A);
  if (circle.id === "B") return cap(problem.labels.B);
  return cap(problem.labels.C ?? "");
}

export function VennDiagram() {
  const [sets, setSets] = useState<SetCount>(2);
  const [mode, setMode] = useState<LabMode>("explore");
  const [shaded, setShaded] = useState<RegionId[]>(() => regionsOf("union", 2));
  const [counts, setCounts] = useState<Counts>(DEFAULT_COUNTS_2);
  const [problemIndex, setProblemIndex] = useState(0);
  const [draft, setDraft] = useState(emptyDraft);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const problem = WORD_PROBLEMS[problemIndex] ?? WORD_PROBLEMS[0];

  const reset = useCallback(() => {
    setSets(2);
    setMode("explore");
    setShaded(regionsOf("union", 2));
    setCounts(defaultCounts(2));
    setProblemIndex(0);
    setDraft(emptyDraft());
    setChecked(false);
    setRevealed(false);
  }, []);

  const selectSets = (next: SetCount) => {
    setSets(next);
    setCounts(defaultCounts(next));
    setShaded(regionsOf(next === 2 ? "union" : "atLeastOne", next));
    if (mode !== "problem") return;
    const index = WORD_PROBLEMS.findIndex((item) => item.sets === next);
    setProblemIndex(index >= 0 ? index : 0);
    setDraft(emptyDraft());
    setChecked(false);
    setRevealed(false);
  };

  const selectMode = (next: LabMode) => {
    setMode(next);
    if (next === "explore") {
      setShaded(regionsOf(sets === 2 ? "union" : "atLeastOne", sets));
      return;
    }
    const index = WORD_PROBLEMS.findIndex((item) => item.sets === sets);
    const chosen = index >= 0 ? index : 0;
    setProblemIndex(chosen);
    setSets(WORD_PROBLEMS[chosen].sets);
    setShaded([]);
    setDraft(emptyDraft());
    setChecked(false);
    setRevealed(false);
  };

  const pickExpression = (id: ExpressionId) => {
    setShaded(regionsOf(id, sets));
  };

  const toggleRegion = (id: RegionId) => {
    setShaded((current) =>
      current.includes(id) ? current.filter((region) => region !== id) : [...current, id],
    );
  };

  const editCount = (id: RegionId, raw: string) => {
    const next = digitsOnly(raw);
    setCounts((current) => ({ ...current, [id]: next === "" ? 0 : Number(next) }));
  };

  const editDraft = (id: RegionId, raw: string) => {
    setDraft((current) => ({ ...current, [id]: digitsOnly(raw) }));
    setChecked(false);
    setRevealed(false);
  };

  const nextProblem = () => {
    const next = (problemIndex + 1) % WORD_PROBLEMS.length;
    const chosen = WORD_PROBLEMS[next];
    setProblemIndex(next);
    setSets(chosen.sets);
    setShaded([]);
    setDraft(emptyDraft());
    setChecked(false);
    setRevealed(false);
  };

  const showSolution = () => {
    setDraft(draftFromSolution(problem));
    setChecked(true);
    setRevealed(true);
  };

  return (
    <div data-tool="venn-diagram">
      <MathLabFrame
        label="Venn diagram lab"
        toolbar={
          <>
            <div role="group" aria-label="Number of sets" className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pillClass(sets === 2)}
                aria-pressed={sets === 2}
                onClick={() => selectSets(2)}
              >
                2 sets
              </button>
              <button
                type="button"
                className={pillClass(sets === 3)}
                aria-pressed={sets === 3}
                onClick={() => selectSets(3)}
              >
                3 sets
              </button>
            </div>
            <div role="group" aria-label="Mode" className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pillClass(mode === "explore")}
                aria-pressed={mode === "explore"}
                onClick={() => selectMode("explore")}
              >
                Explore
              </button>
              <button
                type="button"
                className={pillClass(mode === "problem")}
                aria-pressed={mode === "problem"}
                onClick={() => selectMode("problem")}
              >
                Word problem
              </button>
            </div>
            <button type="button" className="snap-btn-secondary" onClick={reset}>
              Reset
            </button>
          </>
        }
      >
        <VennStage
          sets={sets}
          mode={mode}
          shaded={shaded}
          counts={counts}
          problem={problem}
          draft={draft}
          checked={checked}
          revealed={revealed}
          onPick={pickExpression}
          onToggle={toggleRegion}
          onCount={editCount}
          onDraft={editDraft}
          onCheck={() => setChecked(true)}
          onReveal={showSolution}
          onNext={nextProblem}
          onReset={reset}
        />
      </MathLabFrame>
    </div>
  );
}

function VennStage({
  sets,
  mode,
  shaded,
  counts,
  problem,
  draft,
  checked,
  revealed,
  onPick,
  onToggle,
  onCount,
  onDraft,
  onCheck,
  onReveal,
  onNext,
  onReset,
}: {
  sets: SetCount;
  mode: LabMode;
  shaded: RegionId[];
  counts: Counts;
  problem: WordProblem;
  draft: Record<RegionId, string>;
  checked: boolean;
  revealed: boolean;
  onPick: (id: ExpressionId) => void;
  onToggle: (id: RegionId) => void;
  onCount: (id: RegionId, raw: string) => void;
  onDraft: (id: RegionId, raw: string) => void;
  onCheck: () => void;
  onReveal: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const diagram = sets === 2 ? DIAGRAM_2 : diagramFor(sets);
  const activeProblem = mode === "problem" ? problem : null;
  const matched = matchExpression(shaded, sets);
  const model = formulaFor(matched, counts, sets, shaded);
  const grade = gradeProblem(problem, draft);
  const showWork = mode === "problem" && (revealed || (checked && grade.correct));
  const choices = expressionChoices(sets);
  const hintId = useId();

  const prompt =
    mode === "problem"
      ? "Read the totals, then type one count in each region. Overlaps are included in more than one total."
      : sets === 2
        ? "Pick a formula or tap a region. The count in each region is editable, and the line below uses those counts."
        : "Three sets. Exactly one subtracts both overlaps, then adds the center back.";

  const gradeSentence = grade.correct
    ? `All ${grade.total} regions match.`
    : `${grade.matched} of ${grade.total} regions match.`;

  const announcement =
    mode === "problem"
      ? `${problem.title}. ${problem.ask} ${
          matched ? `Shading matches ${model.title}.` : "No formula shading selected."
        }${checked ? ` ${gradeSentence}` : ""}`
      : model.announcement;

  const [live, setLive] = useState(announcement);

  useEffect(() => {
    const id = window.setTimeout(() => setLive(announcement), 140);
    return () => window.clearTimeout(id);
  }, [announcement]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const targetNode = event.target;
      if (targetNode instanceof Element && targetNode.closest("input, textarea, select")) return;
      if (projector) {
        exit();
        return;
      }
      onReset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, onReset, projector]);

  const displayCount = (id: RegionId) => {
    if (mode === "problem") return draft[id];
    return String(counts[id]);
  };

  return (
    <div
      data-mode={mode}
      data-sets={sets}
      data-expression={matched ?? "custom"}
      data-total={mode === "explore" ? model.total : ""}
      data-shaded={[...shaded].sort().join(" ")}
      data-problem={mode === "problem" ? problem.id : ""}
      data-solved={mode === "problem" && checked && grade.correct ? "true" : "false"}
    >
      <p className="max-w-3xl text-base leading-relaxed text-ink sm:text-lg">{prompt}</p>

      {mode === "problem" ? (
        <div className="mt-5 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Problem</p>
          <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">{problem.title}</h2>
          <p className="mt-2 text-base leading-relaxed text-ink-muted">{problem.prompt}</p>
          <ul className="mt-3 space-y-1 text-base text-ink">
            {problem.given.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-base font-semibold text-ink">{problem.ask}</p>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
            {model.title}
          </p>
          <p
            className={`font-display tabular-nums leading-none text-ink ${
              projector ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
            }`}
          >
            {model.total}
          </p>
        </div>
      )}

      <div className="snap-panel mt-5">
        <DiagramFigure
          diagram={diagram}
          sets={sets}
          shaded={shaded}
          problem={activeProblem}
          displayCount={displayCount}
          grade={mode === "problem" && checked ? grade.results : null}
          onToggle={onToggle}
          onEdit={mode === "problem" ? onDraft : onCount}
          describedBy={hintId}
        />
        <CountList
          className="mt-4 grid grid-cols-2 gap-3 sm:hidden"
          diagram={diagram}
          sets={sets}
          problem={activeProblem}
          displayCount={displayCount}
          grade={mode === "problem" && checked ? grade.results : null}
          onEdit={mode === "problem" ? onDraft : onCount}
        />
      </div>

      <div role="group" aria-label="Formula" className="mt-4 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={pillClass(matched === choice.id)}
            aria-pressed={matched === choice.id}
            aria-label={choice.aria}
            onClick={() => onPick(choice.id)}
          >
            {choice.label}
          </button>
        ))}
      </div>

      {mode === "explore" ? (
        <FormulaBlock model={model} projector={projector} />
      ) : (
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="snap-btn" onClick={onCheck}>
              Check
            </button>
            <button type="button" className="snap-btn-secondary" onClick={onReveal}>
              Show solution
            </button>
            <button type="button" className="snap-btn-secondary" onClick={onNext}>
              Next problem
            </button>
          </div>
          {checked ? (
            <p className={`mt-4 text-base font-semibold sm:text-lg ${grade.correct ? "text-ok" : "text-ink"}`}>
              {gradeSentence}
            </p>
          ) : null}
          {matched ? (
            <p className="mt-3 text-base text-ink">
              This shading is <span className="font-semibold">{model.title}</span>.
            </p>
          ) : shaded.length > 0 ? (
            <p className="mt-3 text-base text-ink-muted">This shading is not a standard formula.</p>
          ) : null}
          {showWork ? (
            <ol className="mt-4 max-w-3xl list-decimal space-y-1 pl-5 text-base leading-relaxed text-ink">
              {problem.steps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : null}
        </div>
      )}

      <p id={hintId} className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted">
        Region counts sit in the diagram. Tab to a region and press Enter to shade it. Escape{" "}
        {projector ? "leaves full screen" : "resets the lab"}.
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {live}
      </p>
    </div>
  );
}

function FormulaBlock({
  model,
  projector,
}: {
  model: ReturnType<typeof formulaFor>;
  projector: boolean;
}) {
  if (model.steps.length === 0) {
    return <p className="mt-5 text-base text-ink-muted">{model.why}</p>;
  }
  return (
    <div className="mt-5 max-w-3xl">
      {model.steps.map((item) => (
        <div key={item.left} className="mt-4 first:mt-0">
          <p className={`leading-snug text-ink ${projector ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`}>
            <span className="font-semibold">{item.left}</span>
            <span className="text-ink-muted"> = {item.symbolic}</span>
          </p>
          <p
            className={`mt-1 font-display tabular-nums text-secondary ${
              projector ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
            }`}
          >
            = {formatSubstitution(item.terms)} = {item.total}
          </p>
        </div>
      ))}
      {model.why ? <p className="mt-3 text-base leading-relaxed text-ink-muted">{model.why}</p> : null}
    </div>
  );
}

function DiagramFigure({
  diagram,
  sets,
  shaded,
  problem,
  displayCount,
  grade,
  onToggle,
  onEdit,
  describedBy,
}: {
  diagram: Diagram;
  sets: SetCount;
  shaded: RegionId[];
  problem: WordProblem | null;
  displayCount: (id: RegionId) => string;
  grade: { id: RegionId; ok: boolean }[] | null;
  onToggle: (id: RegionId) => void;
  onEdit: (id: RegionId, raw: string) => void;
  describedBy: string;
}) {
  const onKey = (id: RegionId) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggle(id);
  };

  const outsideOn = shaded.includes("outside");

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <svg
        viewBox={diagram.viewBox}
        className="h-auto w-full"
        role="group"
        aria-label={
          sets === 2
            ? "Venn diagram of sets A and B inside universal set U"
            : "Venn diagram of sets A, B, and C inside universal set U"
        }
      >
        <g
          role="button"
          tabIndex={0}
          aria-pressed={outsideOn}
          aria-label={regionButtonLabel("outside", sets, problem, outsideOn, displayCount("outside"))}
          aria-describedby={describedBy}
          className="group cursor-pointer"
          onClick={() => onToggle("outside")}
          onKeyDown={onKey("outside")}
        >
          <rect
            x={diagram.rect.x}
            y={diagram.rect.y}
            width={diagram.rect.w}
            height={diagram.rect.h}
            rx={18}
            fill={outsideOn ? SHADED : "var(--surface)"}
          />
          <rect
            x={diagram.rect.x}
            y={diagram.rect.y}
            width={diagram.rect.w}
            height={diagram.rect.h}
            rx={18}
            fill={FOCUS_WASH}
            className="pointer-events-none opacity-0 group-focus-visible:opacity-100"
          />
        </g>
        {diagram.regions
          .filter((region) => region.id !== "outside" && region.d)
          .map((region) => {
            const on = shaded.includes(region.id);
            return (
              <g
                key={region.id}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={regionButtonLabel(region.id, sets, problem, on, displayCount(region.id))}
                aria-describedby={describedBy}
                className="group cursor-pointer"
                onClick={() => onToggle(region.id)}
                onKeyDown={onKey(region.id)}
              >
                <path d={region.d} fill={on ? SHADED : "var(--surface)"} />
                <path
                  d={region.d}
                  fill={FOCUS_WASH}
                  className="pointer-events-none opacity-0 group-focus-visible:opacity-100"
                />
              </g>
            );
          })}
        <g pointerEvents="none" aria-hidden="true">
          <rect
            x={diagram.rect.x}
            y={diagram.rect.y}
            width={diagram.rect.w}
            height={diagram.rect.h}
            rx={18}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={1.75}
            vectorEffect="non-scaling-stroke"
          />
          {diagram.circles.map((circle) => (
            <circle
              key={circle.id}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={1.75}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <text
            x={diagram.rect.x + 16}
            y={diagram.rect.y + 26}
            fill="var(--ink-muted)"
            fontSize={16}
            fontWeight={600}
            fontFamily="inherit"
          >
            U
          </text>
          {diagram.circles.map((circle) => {
            const caption = circleCaption(circle, problem);
            return (
              <text
                key={circle.id}
                x={circle.labelX}
                y={circle.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--ink)"
                fontSize={caption.length > 2 ? 15 : 22}
                fontWeight={600}
                fontFamily="inherit"
              >
                {caption}
              </text>
            );
          })}
          {diagram.regions.map((region) => {
            const value = displayCount(region.id);
            return (
              <text
                key={region.id}
                x={region.labelX}
                y={region.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--ink)"
                fontSize={18}
                fontWeight={600}
                fontFamily="inherit"
                className="sm:hidden"
              >
                {value === "" ? "?" : value}
              </text>
            );
          })}
        </g>
      </svg>
      <CountList
        className="pointer-events-none absolute inset-0 hidden sm:block"
        diagram={diagram}
        sets={sets}
        problem={problem}
        displayCount={displayCount}
        grade={grade}
        onEdit={onEdit}
        floating
      />
    </div>
  );
}

function regionButtonLabel(
  id: RegionId,
  sets: SetCount,
  problem: WordProblem | null,
  shaded: boolean,
  count: string,
) {
  const name = plainName(id, sets, problem);
  const spoken = problem ? name : regionSpoken(id, sets);
  const amount = count === "" ? "empty" : count;
  return `${spoken}, ${shaded ? "shaded" : "not shaded"}, count ${amount}`;
}

function CountList({
  className,
  diagram,
  sets,
  problem,
  displayCount,
  grade,
  onEdit,
  floating = false,
}: {
  className?: string;
  diagram: Diagram;
  sets: SetCount;
  problem: WordProblem | null;
  displayCount: (id: RegionId) => string;
  grade: { id: RegionId; ok: boolean }[] | null;
  onEdit: (id: RegionId, raw: string) => void;
  floating?: boolean;
}) {
  const regions = diagram.regions.filter((region) => regionsFor(sets).includes(region.id));
  return (
    <div className={className}>
      {regions.map((region) => {
        const name = plainName(region.id, sets, problem);
        const row = grade?.find((item) => item.id === region.id);
        const field = (
          <CountField
            name={name}
            value={displayCount(region.id)}
            mark={grade ? row?.ok : undefined}
            compact={floating}
            onChange={(raw) => onEdit(region.id, raw)}
          />
        );
        if (!floating) {
          return (
            <div key={region.id}>
              {field}
            </div>
          );
        }
        return (
          <div
            key={region.id}
            className="pointer-events-auto absolute w-14 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(region.labelX / diagram.width) * 100}%`,
              top: `${(region.labelY / diagram.height) * 100}%`,
            }}
          >
            {region.id === "outside" ? (
              <span
                aria-hidden="true"
                className="mb-0.5 block text-center text-[11px] font-semibold text-ink-muted"
              >
                Neither
              </span>
            ) : null}
            {field}
          </div>
        );
      })}
    </div>
  );
}

function CountField({
  name,
  value,
  mark,
  compact,
  onChange,
}: {
  name: string;
  value: string;
  mark?: boolean;
  compact?: boolean;
  onChange: (raw: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink sm:sr-only">{name}</span>
      <input
        inputMode="numeric"
        autoComplete="off"
        className={`snap-input h-11 px-1 text-center font-display text-lg tabular-nums ${
          compact ? "" : "w-full"
        } ${mark === true ? "border-ok" : ""}`}
        style={compact ? { width: "3.5rem" } : undefined}
        aria-invalid={mark === false ? true : undefined}
        placeholder="?"
        value={value}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
