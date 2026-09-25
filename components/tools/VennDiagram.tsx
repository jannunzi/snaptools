"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MutableRefObject,
} from "react";
import { MathLabFrame, useMathLabProjector } from "@/components/labs/MathLabFrame";
import {
  DE_MORGAN,
  DEFAULT_COUNTS_2,
  DIAGRAM_2,
  LETTER_ELEMENTS,
  NUMBER_ELEMENTS,
  WORD_PROBLEMS,
  defaultCounts,
  deMorganCount,
  deMorganValue,
  diagramFor,
  draftFromSolution,
  elementReading,
  elementsInRegion,
  emptyDraft,
  expressionChoices,
  formatSubstitution,
  formulaFor,
  gradeProblem,
  matchExpression,
  memberDraftFrom,
  placeElement,
  regionName,
  regionSpoken,
  regionsFor,
  regionsOf,
  withSet,
  withUniverse,
  type Counts,
  type Diagram,
  type DiagramCircle,
  type ElementSets,
  type ExpressionId,
  type LabMode,
  type MemberDraft,
  type RegionId,
  type Representation,
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
  const [representation, setRepresentation] = useState<Representation>("counts");
  const [shaded, setShaded] = useState<RegionId[]>(() => regionsOf("union", 2));
  const [counts, setCounts] = useState<Counts>(DEFAULT_COUNTS_2);
  const [elements, setElements] = useState<ElementSets>(NUMBER_ELEMENTS);
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(() => memberDraftFrom(NUMBER_ELEMENTS));
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [problemIndex, setProblemIndex] = useState(0);
  const [draft, setDraft] = useState(emptyDraft);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const pendingFocus = useRef<string | null>(null);

  const problem = WORD_PROBLEMS[problemIndex] ?? WORD_PROBLEMS[0];

  const reset = useCallback(() => {
    setSets(2);
    setMode("explore");
    setRepresentation("counts");
    setShaded(regionsOf("union", 2));
    setCounts(defaultCounts(2));
    setElements(NUMBER_ELEMENTS);
    setMemberDraft(memberDraftFrom(NUMBER_ELEMENTS));
    setSelectedElement(null);
    setNotice("");
    setProblemIndex(0);
    setDraft(emptyDraft());
    setChecked(false);
    setRevealed(false);
  }, []);

  const selectSets = (next: SetCount) => {
    if (mode === "demorgan" && next === 3) {
      setMode("explore");
    }
    if (mode === "demorgan" && next === 2) return;
    setSets(next);
    setCounts(defaultCounts(next));
    setShaded(regionsOf(next === 2 ? "union" : "atLeastOne", next));
    setSelectedElement(null);
    if (mode !== "problem") return;
    const index = WORD_PROBLEMS.findIndex((item) => item.sets === next);
    setProblemIndex(index >= 0 ? index : 0);
    setDraft(emptyDraft());
    setChecked(false);
    setRevealed(false);
  };

  const selectMode = (next: LabMode) => {
    setMode(next);
    setSelectedElement(null);
    setNotice("");
    if (next === "demorgan") {
      if (sets !== 2) {
        setSets(2);
        setCounts(defaultCounts(2));
      }
      return;
    }
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

  const applyElements = (next: ElementSets, draftNext?: MemberDraft) => {
    setElements(next);
    setMemberDraft(draftNext ?? memberDraftFrom(next));
  };

  const usePreset = (preset: ElementSets) => {
    applyElements(preset);
    setSelectedElement(null);
    setNotice("");
  };

  const editUniverse = (raw: string) => {
    const next = withUniverse(elements, raw);
    setElements(next);
    setMemberDraft({ ...memberDraftFrom(next), U: raw });
    setNotice("");
  };

  const editSet = (which: "A" | "B" | "C", raw: string) => {
    const next = withSet(elements, which, raw);
    setElements(next);
    setMemberDraft({ ...memberDraftFrom(next), [which]: raw });
    setNotice("");
  };

  const place = (element: string, region: RegionId) => {
    const from = regionsFor(sets).find((id) => elementsInRegion(elements, id, sets).includes(element));
    if (from === region) {
      setSelectedElement(null);
      return;
    }
    pendingFocus.current = element;
    applyElements(placeElement(elements, element, region, sets));
    setSelectedElement(null);
    setNotice(`Moved ${element} to ${regionSpoken(region, sets)}.`);
  };

  const pickExpression = (id: ExpressionId) => {
    setShaded(regionsOf(id, sets));
    setNotice("");
  };

  const toggleRegion = (id: RegionId) => {
    setShaded((current) =>
      current.includes(id) ? current.filter((region) => region !== id) : [...current, id],
    );
    setNotice("");
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
            {mode !== "problem" ? (
              <div role="group" aria-label="Values" className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={pillClass(representation === "counts")}
                  aria-pressed={representation === "counts"}
                  onClick={() => setRepresentation("counts")}
                >
                  Counts
                </button>
                <button
                  type="button"
                  className={pillClass(representation === "elements")}
                  aria-pressed={representation === "elements"}
                  onClick={() => setRepresentation("elements")}
                >
                  Elements
                </button>
              </div>
            ) : null}
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
              <button
                type="button"
                className={pillClass(mode === "demorgan")}
                aria-pressed={mode === "demorgan"}
                aria-label="De Morgan's laws"
                onClick={() => selectMode("demorgan")}
              >
                De Morgan
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
          representation={representation}
          shaded={shaded}
          counts={counts}
          elements={elements}
          memberDraft={memberDraft}
          selectedElement={selectedElement}
          notice={notice}
          pendingFocusRef={pendingFocus}
          problem={problem}
          draft={draft}
          checked={checked}
          revealed={revealed}
          onPick={pickExpression}
          onToggle={toggleRegion}
          onCount={editCount}
          onDraft={editDraft}
          onUniverse={editUniverse}
          onSet={editSet}
          onPreset={usePreset}
          onSelectElement={setSelectedElement}
          onPlace={place}
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
  representation,
  shaded,
  counts,
  elements,
  memberDraft,
  selectedElement,
  notice,
  pendingFocusRef,
  problem,
  draft,
  checked,
  revealed,
  onPick,
  onToggle,
  onCount,
  onDraft,
  onUniverse,
  onSet,
  onPreset,
  onSelectElement,
  onPlace,
  onCheck,
  onReveal,
  onNext,
  onReset,
}: {
  sets: SetCount;
  mode: LabMode;
  representation: Representation;
  shaded: RegionId[];
  counts: Counts;
  elements: ElementSets;
  memberDraft: MemberDraft;
  selectedElement: string | null;
  notice: string;
  pendingFocusRef: MutableRefObject<string | null>;
  problem: WordProblem;
  draft: Record<RegionId, string>;
  checked: boolean;
  revealed: boolean;
  onPick: (id: ExpressionId) => void;
  onToggle: (id: RegionId) => void;
  onCount: (id: RegionId, raw: string) => void;
  onDraft: (id: RegionId, raw: string) => void;
  onUniverse: (raw: string) => void;
  onSet: (which: "A" | "B" | "C", raw: string) => void;
  onPreset: (preset: ElementSets) => void;
  onSelectElement: (element: string | null) => void;
  onPlace: (element: string, region: RegionId) => void;
  onCheck: () => void;
  onReveal: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const diagram = sets === 2 ? DIAGRAM_2 : diagramFor(sets);
  const showElements = representation === "elements" && mode !== "problem";
  const activeProblem = mode === "problem" ? problem : null;
  const matched = matchExpression(shaded, sets);
  const model = formulaFor(matched, counts, sets, shaded);
  const reading = elementReading(matched, elements, sets, shaded);
  const grade = gradeProblem(problem, draft);
  const showWork = mode === "problem" && (revealed || (checked && grade.correct));
  const choices = expressionChoices(sets);
  const hintId = useId();
  const demorganEqual = DE_MORGAN.every((pair) => {
    if (showElements) return deMorganValue(elements, pair.left.regions) === deMorganValue(elements, pair.right.regions);
    return deMorganCount(counts, pair.left.regions, 2) === deMorganCount(counts, pair.right.regions, 2);
  });

  const prompt =
    mode === "demorgan"
      ? "Each row is one law. The two diagrams shade the same region, so both sides name the same set."
      : mode === "problem"
        ? "Read the totals, then type one count in each region. Overlaps are included in more than one total."
        : showElements
          ? "Drag an element into a region, or edit the sets. The line below writes the shaded set in roster notation."
          : sets === 2
            ? "Pick a formula or tap a region. The count in each region is editable, and the line below uses those counts."
            : "Three sets. Exactly one subtracts both overlaps, then adds the center back.";

  const gradeSentence = grade.correct
    ? `All ${grade.total} regions match.`
    : `${grade.matched} of ${grade.total} regions match.`;

  const demorganSpeech = DE_MORGAN.map((pair) => {
    const value = showElements
      ? deMorganValue(elements, pair.left.regions)
      : String(deMorganCount(counts, pair.left.regions, 2));
    return `${pair.spoken} Both sides equal ${value}.`;
  }).join(" ");

  const announcement =
    mode === "demorgan"
      ? `${notice} De Morgan. ${demorganSpeech}`.trim()
      : mode === "problem"
        ? `${problem.title}. ${problem.ask} ${
            matched ? `Shading matches ${model.title}.` : "No formula shading selected."
          }${checked ? ` ${gradeSentence}` : ""}`
        : showElements
          ? `${notice} ${reading.spoken}`.trim()
          : model.announcement;

  const [live, setLive] = useState(announcement);

  useEffect(() => {
    const id = window.setTimeout(() => setLive(announcement), 140);
    return () => window.clearTimeout(id);
  }, [announcement]);

  useEffect(() => {
    const element = pendingFocusRef.current;
    if (!element) return;
    pendingFocusRef.current = null;
    const nodes = [...document.querySelectorAll(`[data-chip="${CSS.escape(element)}"]`)];
    const visible = nodes.find((node) => node instanceof HTMLElement && node.offsetParent !== null);
    if (visible instanceof HTMLElement) visible.focus();
  }, [elements, pendingFocusRef]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const targetNode = event.target;
      if (targetNode instanceof Element && targetNode.closest("input, textarea, select")) return;
      if (projector) {
        exit();
        return;
      }
      if (selectedElement) {
        onSelectElement(null);
        return;
      }
      onReset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, onReset, onSelectElement, projector, selectedElement]);

  const displayCount = (id: RegionId) => {
    if (mode === "problem") return draft[id];
    return String(counts[id]);
  };

  const detailFor = (id: RegionId) => {
    if (!showElements) {
      const value = displayCount(id);
      return value === "" ? "count empty" : `count ${value}`;
    }
    const members = elementsInRegion(elements, id, sets);
    return members.length === 0 ? "no elements" : `elements ${members.join(", ")}`;
  };

  const activateRegion = (id: RegionId) => {
    if (showElements && selectedElement) {
      onPlace(selectedElement, id);
      return;
    }
    onToggle(id);
  };

  return (
    <div
      data-mode={mode}
      data-sets={sets}
      data-representation={mode === "problem" ? "counts" : representation}
      data-expression={mode === "demorgan" ? "demorgan" : (matched ?? "custom")}
      data-total={mode === "explore" && !showElements ? model.total : ""}
      data-shaded={mode === "demorgan" ? "" : [...shaded].sort().join(" ")}
      data-roster={mode === "explore" && showElements ? reading.roster : ""}
      data-builder={mode === "explore" && showElements ? reading.builder : ""}
      data-equation={mode === "explore" && showElements ? reading.equation : ""}
      data-equal={mode === "demorgan" ? String(demorganEqual) : ""}
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
      ) : mode === "demorgan" ? (
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
          De Morgan’s laws
        </p>
      ) : (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
            {showElements ? reading.title : model.title}
          </p>
          <p
            className={`font-display text-ink ${
              showElements
                ? "text-3xl leading-tight sm:text-4xl"
                : `tabular-nums leading-none ${projector ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"}`
            }`}
          >
            {showElements ? reading.equation : model.total}
          </p>
        </div>
      )}

      {showElements ? (
        <MemberFields
          sets={mode === "demorgan" ? 2 : sets}
          draft={memberDraft}
          onUniverse={onUniverse}
          onSet={onSet}
          onPreset={onPreset}
        />
      ) : null}

      {mode === "demorgan" ? (
        <DeMorganView
          counts={counts}
          elements={elements}
          showElements={showElements}
          onCount={onCount}
        />
      ) : (
        <div className="snap-panel mt-5">
          <DiagramFigure
            diagram={diagram}
            sets={sets}
            shaded={shaded}
            problem={activeProblem}
            displayCount={displayCount}
            detailFor={detailFor}
            grade={mode === "problem" && checked ? grade.results : null}
            showElements={showElements}
            elements={elements}
            selectedElement={selectedElement}
            onToggle={activateRegion}
            onEdit={mode === "problem" ? onDraft : onCount}
            onSelectElement={onSelectElement}
            onPlace={onPlace}
            describedBy={hintId}
          />
          {showElements ? (
            <ElementList
              className="mt-4 grid gap-4 sm:hidden"
              diagram={diagram}
              sets={sets}
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={onSelectElement}
              onPlace={onPlace}
            />
          ) : (
            <CountList
              className="mt-4 grid grid-cols-2 gap-3 sm:hidden"
              diagram={diagram}
              sets={sets}
              problem={activeProblem}
              displayCount={displayCount}
              grade={mode === "problem" && checked ? grade.results : null}
              onEdit={mode === "problem" ? onDraft : onCount}
            />
          )}
        </div>
      )}

      {mode !== "demorgan" ? (
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
      ) : null}

      {mode === "explore" ? (
        showElements ? (
          <ElementBlock reading={reading} />
        ) : (
          <FormulaBlock model={model} projector={projector} />
        )
      ) : mode === "problem" ? (
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
      ) : null}

      {showElements && selectedElement ? (
        <p className="mt-4 text-sm text-ink-muted">
          {selectedElement} is selected. Choose a region to move it, or press an arrow key.
        </p>
      ) : null}

      <p id={hintId} className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted">
        {mode === "demorgan"
          ? "Edit the counts or the elements and both diagrams in a row stay equal."
          : showElements
            ? "Drag an element into a region. On a keyboard, use the arrow keys, or select an element and press Enter on a region."
            : "Region counts sit in the diagram. Tab to a region and press Enter to shade it."}{" "}
        Escape {projector ? "leaves full screen" : selectedElement ? "clears the selection" : "resets the lab"}.
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
  detailFor,
  grade,
  showElements,
  elements,
  selectedElement,
  onToggle,
  onEdit,
  onSelectElement,
  onPlace,
  describedBy,
}: {
  diagram: Diagram;
  sets: SetCount;
  shaded: RegionId[];
  problem: WordProblem | null;
  displayCount: (id: RegionId) => string;
  detailFor: (id: RegionId) => string;
  grade: { id: RegionId; ok: boolean }[] | null;
  showElements: boolean;
  elements: ElementSets;
  selectedElement: string | null;
  onToggle: (id: RegionId) => void;
  onEdit: (id: RegionId, raw: string) => void;
  onSelectElement: (element: string | null) => void;
  onPlace: (element: string, region: RegionId) => void;
  describedBy: string;
}) {
  const onKey = (id: RegionId) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggle(id);
  };

  const allowDrop = (event: DragEvent<SVGGElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const dropOn = (id: RegionId) => (event: DragEvent<SVGGElement>) => {
    event.preventDefault();
    const element = event.dataTransfer.getData("text/plain");
    if (element) onPlace(element, id);
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
          aria-label={regionButtonLabel("outside", sets, problem, outsideOn, detailFor("outside"))}
          data-region="outside"
          onDragOver={allowDrop}
          onDrop={dropOn("outside")}
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
                aria-label={regionButtonLabel(region.id, sets, problem, on, detailFor(region.id))}
                data-region={region.id}
                onDragOver={allowDrop}
                onDrop={dropOn(region.id)}
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
          {showElements
            ? null
            : diagram.regions.map((region) => {
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
      {showElements ? (
        <ElementList
          className="pointer-events-none absolute inset-0 hidden sm:block"
          diagram={diagram}
          sets={sets}
          elements={elements}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          onPlace={onPlace}
          floating
        />
      ) : (
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
      )}
    </div>
  );
}

function regionButtonLabel(
  id: RegionId,
  sets: SetCount,
  problem: WordProblem | null,
  shaded: boolean,
  detail: string,
) {
  const name = plainName(id, sets, problem);
  const spoken = problem ? name : regionSpoken(id, sets);
  return `${spoken}, ${shaded ? "shaded" : "not shaded"}, ${detail}`;
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
  labeled = false,
  onChange,
}: {
  name: string;
  value: string;
  mark?: boolean;
  compact?: boolean;
  labeled?: boolean;
  onChange: (raw: string) => void;
}) {
  return (
    <label className="block">
      <span className={`mb-1 block text-sm font-semibold text-ink ${labeled ? "" : "sm:sr-only"}`}>{name}</span>
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

function ElementBlock({ reading }: { reading: ReturnType<typeof elementReading> }) {
  return (
    <p className="mt-5 max-w-3xl font-display text-2xl leading-snug text-secondary sm:text-3xl">
      {reading.builder}
    </p>
  );
}

function MemberFields({
  sets,
  draft,
  onUniverse,
  onSet,
  onPreset,
}: {
  sets: SetCount;
  draft: MemberDraft;
  onUniverse: (raw: string) => void;
  onSet: (which: "A" | "B" | "C", raw: string) => void;
  onPreset: (preset: ElementSets) => void;
}) {
  return (
    <div className="mt-5 max-w-3xl">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="snap-btn-secondary" onClick={() => onPreset(NUMBER_ELEMENTS)}>
          Numbers 1–10
        </button>
        <button type="button" className="snap-btn-secondary" onClick={() => onPreset(LETTER_ELEMENTS)}>
          Letters a–h
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MemberField label="Universal set U" value={draft.U} onChange={onUniverse} />
        <MemberField label="Set A" value={draft.A} onChange={(raw) => onSet("A", raw)} />
        <MemberField label="Set B" value={draft.B} onChange={(raw) => onSet("B", raw)} />
        {sets === 3 ? (
          <MemberField label="Set C" value={draft.C} onChange={(raw) => onSet("C", raw)} />
        ) : null}
      </div>
    </div>
  );
}

function MemberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (raw: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      <input
        className="snap-input w-full"
        autoComplete="off"
        spellCheck={false}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ElementList({
  className,
  diagram,
  sets,
  elements,
  selectedElement,
  onSelectElement,
  onPlace,
  floating = false,
}: {
  className?: string;
  diagram: Diagram;
  sets: SetCount;
  elements: ElementSets;
  selectedElement: string | null;
  onSelectElement: (element: string | null) => void;
  onPlace: (element: string, region: RegionId) => void;
  floating?: boolean;
}) {
  const regions = diagram.regions.filter((region) => regionsFor(sets).includes(region.id));
  return (
    <div className={className}>
      {regions.map((region) => {
        const members = elementsInRegion(elements, region.id, sets);
        const cluster = (
          <div
            className={floating ? "flex max-w-36 flex-wrap justify-center gap-1" : "mt-2 flex flex-wrap gap-2"}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const element = event.dataTransfer.getData("text/plain");
              if (element) onPlace(element, region.id);
            }}
          >
            {members.map((element) => (
              <ElementChip
                key={element}
                element={element}
                region={region.id}
                sets={sets}
                selected={selectedElement === element}
                onSelect={onSelectElement}
                onPlace={onPlace}
              />
            ))}
          </div>
        );
        if (floating) {
          return (
            <div
              key={region.id}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(region.labelX / diagram.width) * 100}%`,
                top: `${(region.labelY / diagram.height) * 100}%`,
              }}
            >
              {region.id === "outside" ? (
                <span aria-hidden="true" className="mb-0.5 block text-center text-[11px] font-semibold text-ink-muted">
                  Neither
                </span>
              ) : null}
              {cluster}
            </div>
          );
        }
        return (
          <div key={region.id}>
            <p className="text-sm font-semibold text-ink">{regionName(region.id, sets)}</p>
            {members.length === 0 ? <p className="mt-1 text-sm text-ink-muted">Empty</p> : cluster}
            <label className="mt-2 block">
              <span className="sr-only">Move into {regionName(region.id, sets)}</span>
              <select
                className="snap-input"
                aria-label={`Move an element into ${regionName(region.id, sets)}`}
                value=""
                onChange={(event) => {
                  const element = event.target.value;
                  if (element) onPlace(element, region.id);
                }}
              >
                <option value="">Move an element here</option>
                {elements.universe
                  .filter((element) => !members.includes(element))
                  .map((element) => (
                    <option key={element} value={element}>
                      {element}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        );
      })}
    </div>
  );
}

function ElementChip({
  element,
  region,
  sets,
  selected,
  onSelect,
  onPlace,
}: {
  element: string;
  region: RegionId;
  sets: SetCount;
  selected: boolean;
  onSelect: (element: string | null) => void;
  onPlace: (element: string, region: RegionId) => void;
}) {
  const move = (delta: number) => {
    const regions = regionsFor(sets);
    const index = regions.indexOf(region);
    const next = regions[(index + delta + regions.length) % regions.length];
    onPlace(element, next);
  };

  return (
    <button
      type="button"
      draggable
      data-chip={element}
      aria-pressed={selected}
      aria-label={`${element}, in ${regionSpoken(region, sets)}. Arrow keys move it.`}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm font-semibold ${
        selected ? "border-ink bg-accent text-accent-ink" : "border-line bg-surface text-ink"
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(selected ? null : element);
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", element);
        event.dataTransfer.effectAllowed = "move";
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowUp") {
          return;
        }
        event.preventDefault();
        move(event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1);
      }}
    >
      {element}
    </button>
  );
}

function DeMorganView({
  counts,
  elements,
  showElements,
  onCount,
}: {
  counts: Counts;
  elements: ElementSets;
  showElements: boolean;
  onCount: (id: RegionId, raw: string) => void;
}) {
  return (
    <div className="mt-5">
      {showElements ? null : (
        <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {regionsFor(2).map((id) => (
            <CountField
              key={id}
              name={regionName(id, 2)}
              value={String(counts[id])}
              labeled
              onChange={(raw) => onCount(id, raw)}
            />
          ))}
        </div>
      )}
      <div className="mt-6 space-y-10">
        {DE_MORGAN.map((pair) => {
          const leftValue = showElements
            ? deMorganValue(elements, pair.left.regions)
            : String(deMorganCount(counts, pair.left.regions, 2));
          const rightValue = showElements
            ? deMorganValue(elements, pair.right.regions)
            : String(deMorganCount(counts, pair.right.regions, 2));
          return (
            <section
              key={pair.id}
              aria-label={pair.law}
              data-law={pair.id}
              data-equal={String(leftValue === rightValue)}
              data-value={leftValue}
              data-shaded={[...pair.left.regions].sort().join(" ")}
            >
              <h2 className="font-display text-2xl text-ink sm:text-3xl">{pair.law}</h2>
              <div className="mt-4 grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                <DeMorganSideView title={pair.left.title} builder={pair.left.builder} value={leftValue} regions={pair.left.regions} showElements={showElements} spoken={pair.left.spoken} />
                <p className="text-center font-display text-3xl text-ink sm:pt-16" aria-hidden="true">
                  =
                </p>
                <DeMorganSideView title={pair.right.title} builder={pair.right.builder} value={rightValue} regions={pair.right.regions} showElements={showElements} spoken={pair.right.spoken} />
              </div>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-muted">{pair.why}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DeMorganSideView({
  title,
  builder,
  value,
  regions,
  showElements,
  spoken,
}: {
  title: string;
  builder: string;
  value: string;
  regions: readonly RegionId[];
  showElements: boolean;
  spoken: string;
}) {
  const shaded = regions.join(", ");
  return (
    <figure className="min-w-0">
      <ShadePreview label={`${spoken}. ${showElements ? `Elements ${value}` : `Count ${value}`}. Shaded ${shaded}.`} regions={regions} />
      <figcaption className="mt-3">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className={`mt-1 font-display text-secondary ${showElements ? "text-xl leading-tight sm:text-2xl" : "text-3xl tabular-nums"}`}>
          {value}
        </p>
        {showElements ? <p className="mt-1 text-sm leading-relaxed text-ink-muted">{builder}</p> : null}
      </figcaption>
    </figure>
  );
}

function ShadePreview({ regions, label }: { regions: readonly RegionId[]; label: string }) {
  const diagram = DIAGRAM_2;
  const on = (id: RegionId) => regions.includes(id);
  return (
    <svg viewBox={diagram.viewBox} className="h-auto w-full" role="img" aria-label={label}>
      <rect
        x={diagram.rect.x}
        y={diagram.rect.y}
        width={diagram.rect.w}
        height={diagram.rect.h}
        rx={18}
        fill={on("outside") ? SHADED : "var(--surface)"}
      />
      {diagram.regions
        .filter((region) => region.id !== "outside" && region.d)
        .map((region) => (
          <path key={region.id} d={region.d} fill={on(region.id) ? SHADED : "var(--surface)"} />
        ))}
      <g aria-hidden="true" pointerEvents="none">
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
        <text x={diagram.rect.x + 16} y={diagram.rect.y + 26} fill="var(--ink-muted)" fontSize={16} fontWeight={600}>
          U
        </text>
        {diagram.circles.map((circle) => (
          <text
            key={circle.id}
            x={circle.labelX}
            y={circle.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--ink)"
            fontSize={22}
            fontWeight={600}
          >
            {circle.id}
          </text>
        ))}
      </g>
    </svg>
  );
}
