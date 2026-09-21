"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { MathLabFrame, useMathLabProjector } from "@/components/labs/MathLabFrame";
import {
  EXPLORE_LEGS,
  LEG_MAX,
  LEG_MIN,
  PUZZLES,
  TRIPLES,
  answerMatches,
  clampLeg,
  describePythagoras,
  equationParts,
  equationText,
  figure,
  formatMeasure,
  gradeAnswer,
  identityHolds,
  legLocked,
  matchingTriple,
  measure,
  modePrompt,
  pointList,
  puzzleAnswer,
  puzzleStart,
  stepLeg,
  type CheckStatus,
  type Figure,
  type LabMode,
  type Point,
  type Segment,
  type TripleId,
} from "@/lib/pythagoras";

const MODES: { id: LabMode; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "missing", label: "Missing side" },
  { id: "triples", label: "Triples" },
];

function pillClass(active: boolean) {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-3.5 text-sm font-semibold ${
    active
      ? "border-ink bg-accent text-accent-ink"
      : "border-line bg-surface text-ink hover:border-ink"
  }`;
}

function viewBoxFor(model: Figure) {
  const pad = model.span * 0.09;
  const { minX, minY, maxX, maxY } = model.bounds;
  const x = minX - pad;
  const y = -(maxY + pad);
  const width = maxX - minX + pad * 2;
  const height = maxY - minY + pad * 2;
  return `${x} ${y} ${width} ${height}`;
}

function clientToMath(group: SVGGElement, clientX: number, clientY: number) {
  const ctm = group.getScreenCTM();
  const svg = group.ownerSVGElement;
  if (!ctm || !svg) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const local = point.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

function Stat({
  label,
  value,
  large,
  name,
  tone,
}: {
  label: string;
  value: string;
  large: boolean;
  name: string;
  tone: "a" | "b" | "c";
}) {
  const accent = tone === "a" ? "text-secondary" : "text-ink";
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${accent}`}>{label}</p>
      <p
        data-stat={name}
        className={`font-display tabular-nums leading-none text-ink ${large ? "text-6xl sm:text-7xl" : "text-5xl sm:text-6xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function AreaChip({
  label,
  value,
  tone,
  large,
}: {
  label: string;
  value: string;
  tone: "a" | "b" | "c";
  large: boolean;
}) {
  const face =
    tone === "a"
      ? "border-secondary bg-secondary-soft"
      : tone === "b"
        ? "border-ink bg-accent-soft"
        : "border-ink bg-surface";
  return (
    <div className={`min-w-24 rounded-2xl border px-4 py-2 ${face}`} data-area={tone}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className={`font-display tabular-nums leading-none text-ink ${large ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>
        {value}
      </p>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (direction: -1 | 1) => void;
  disabled?: boolean;
}) {
  const numeric = Number(value);
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <span className="w-14 text-sm font-semibold text-ink">{label}</span>
      <button
        type="button"
        className="snap-btn-secondary min-w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Decrease ${label}`}
        disabled={disabled || numeric <= min}
        onClick={() => onChange(-1)}
      >
        −
      </button>
      <span className="w-14 text-center font-display text-2xl tabular-nums text-ink">{value}</span>
      <button
        type="button"
        className="snap-btn-secondary min-w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Increase ${label}`}
        disabled={disabled || numeric >= max}
        onClick={() => onChange(1)}
      >
        +
      </button>
    </div>
  );
}

function GridLines({ lines, color }: { lines: readonly Segment[]; color: string }) {
  if (lines.length === 0) return null;
  return (
    <g aria-hidden="true" pointerEvents="none">
      {lines.map((line) => (
        <line
          key={`${line.x1},${line.y1},${line.x2},${line.y2}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={color}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          strokeOpacity={0.45}
        />
      ))}
    </g>
  );
}

function SquareLabel({
  at,
  caption,
  value,
  size,
}: {
  at: Point;
  caption: string;
  value: string;
  size: number;
}) {
  const y = -at.y;
  return (
    <g pointerEvents="none" aria-hidden="true">
      <text
        x={at.x}
        y={y - size * 0.42}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.max(size * 0.38, size * 0.34)}
        fill="var(--ink-muted)"
        fontWeight={600}
        fontFamily="inherit"
      >
        {caption}
      </text>
      <text
        x={at.x}
        y={y + size * 0.32}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size}
        fill="var(--ink)"
        fontWeight={600}
        fontFamily="inherit"
      >
        {value}
      </text>
    </g>
  );
}

function TriangleFigure({
  model,
  why,
  snap,
  lockA,
  lockB,
  hideHypotenuse,
  areaA,
  areaB,
  areaC,
  onA,
  onB,
}: {
  model: Figure;
  why: boolean;
  snap: boolean;
  lockA: boolean;
  lockB: boolean;
  hideHypotenuse: boolean;
  areaA: string;
  areaB: string;
  areaC: string;
  onA: (value: number) => void;
  onB: (value: number) => void;
}) {
  const groupRef = useRef<SVGGElement>(null);
  const titleId = useId();
  const hit = model.span * 0.072;
  const knob = hit * 0.46;

  const move = (which: "a" | "b", clientX: number, clientY: number) => {
    const group = groupRef.current;
    if (!group) return;
    const point = clientToMath(group, clientX, clientY);
    if (!point) return;
    if (which === "a") onA(point.x);
    else onB(point.y);
  };

  const onKey = (which: "a" | "b", event: ReactKeyboardEvent<SVGGElement>) => {
    let direction: -1 | 1 | 0 = 0;
    if (which === "a") {
      if (event.key === "ArrowRight" || event.key === "ArrowUp") direction = 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") direction = -1;
    } else if (event.key === "ArrowUp" || event.key === "ArrowRight") direction = 1;
    else if (event.key === "ArrowDown" || event.key === "ArrowLeft") direction = -1;
    const apply = which === "a" ? onA : onB;
    const current = which === "a" ? model.measures.a : model.measures.b;
    if (event.key === "Home") {
      event.preventDefault();
      apply(LEG_MIN);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      apply(LEG_MAX);
      return;
    }
    if (!direction) return;
    event.preventDefault();
    if (snap || event.shiftKey) apply(clampLeg(Math.round(current) + direction, true));
    else apply(stepLeg(current, direction, false));
  };

  const onPointerDown = (which: "a" | "b", event: ReactPointerEvent<SVGGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    move(which, event.clientX, event.clientY);
  };

  return (
    <svg
      viewBox={viewBoxFor(model)}
      className="h-auto w-full touch-none select-none"
      role="group"
      aria-labelledby={titleId}
    >
      <title id={titleId}>Right triangle with squares on each side</title>
      <g ref={groupRef} transform="scale(1,-1)">
        <polygon points={pointList(model.squareB)} fill="var(--accent-soft)" pointerEvents="none" />
        <polygon points={pointList(model.squareA)} fill="var(--secondary-soft)" pointerEvents="none" />
        <polygon points={pointList(model.squareC)} fill="var(--surface)" pointerEvents="none" />
        <GridLines lines={model.gridB} color="var(--ink)" />
        <GridLines lines={model.gridA} color="var(--secondary)" />
        {why ? null : <GridLines lines={model.gridC} color="var(--ink)" />}
        <polygon
          points={pointList(model.rectB)}
          fill="var(--accent-soft)"
          pointerEvents="none"
          style={{ opacity: why ? 1 : 0 }}
          className="transition-opacity duration-500 ease-out motion-reduce:transition-none"
        />
        <polygon
          points={pointList(model.rectA)}
          fill="var(--secondary-soft)"
          pointerEvents="none"
          style={{ opacity: why ? 1 : 0 }}
          className="transition-opacity duration-500 ease-out motion-reduce:transition-none"
        />
        {why ? <GridLines lines={model.gridC} color="var(--ink)" /> : null}
        <line
          x1={model.split.x1}
          y1={model.split.y1}
          x2={model.split.x2}
          y2={model.split.y2}
          stroke="var(--ink)"
          strokeWidth={2}
          strokeDasharray="7 6"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
          style={{ opacity: why ? 1 : 0 }}
          className="transition-opacity duration-500 ease-out motion-reduce:transition-none"
        />
        <polygon
          points={pointList(model.squareB)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <polygon
          points={pointList(model.squareA)}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <polygon
          points={pointList(model.squareC)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <polygon points={pointList([model.C, model.A, model.B])} fill="var(--surface)" pointerEvents="none" />
        <polygon
          points={pointList([model.C, model.A, model.B])}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <polyline
          points={pointList(model.rightAngle)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        {lockA ? null : (
          <Handle
            at={model.A}
            hit={hit}
            knob={knob}
            label="Leg a"
            orientation="horizontal"
            min={LEG_MIN}
            max={LEG_MAX}
            now={model.measures.a}
            text={`${formatMeasure(model.measures.a)} units`}
            onPointerDown={(event) => onPointerDown("a", event)}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              move("a", event.clientX, event.clientY);
            }}
            onKeyDown={(event) => onKey("a", event)}
          />
        )}
        {lockB ? null : (
          <Handle
            at={model.B}
            hit={hit}
            knob={knob}
            label="Leg b"
            orientation="vertical"
            min={LEG_MIN}
            max={LEG_MAX}
            now={model.measures.b}
            text={`${formatMeasure(model.measures.b)} units`}
            onPointerDown={(event) => onPointerDown("b", event)}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              move("b", event.clientX, event.clientY);
            }}
            onKeyDown={(event) => onKey("b", event)}
          />
        )}
      </g>
      <g pointerEvents="none" aria-hidden="true">
        <text
          x={model.labels.a.x}
          y={-model.labels.a.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={model.labelSize.side}
          fill="var(--ink)"
          fontWeight={600}
          fontFamily="inherit"
        >
          a
        </text>
        <text
          x={model.labels.b.x}
          y={-model.labels.b.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={model.labelSize.side}
          fill="var(--ink)"
          fontWeight={600}
          fontFamily="inherit"
        >
          b
        </text>
        <text
          x={model.labels.c.x}
          y={-model.labels.c.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={model.labelSize.side}
          fill="var(--ink)"
          fontWeight={600}
          fontFamily="inherit"
        >
          c
        </text>
      </g>
      <SquareLabel at={model.labels.a2} caption="a²" value={areaA} size={model.labelSize.a} />
      <SquareLabel at={model.labels.b2} caption="b²" value={areaB} size={model.labelSize.b} />
      {why ? (
        <>
          {model.showRectLabel.a ? (
            <SquareLabel at={model.labels.rectA} caption="a²" value={areaA} size={model.labelSize.a * 0.72} />
          ) : null}
          {model.showRectLabel.b ? (
            <SquareLabel at={model.labels.rectB} caption="b²" value={areaB} size={model.labelSize.b * 0.72} />
          ) : null}
        </>
      ) : (
        <SquareLabel
          at={model.labels.c2}
          caption="c²"
          value={hideHypotenuse ? "?" : areaC}
          size={model.labelSize.c}
        />
      )}
    </svg>
  );
}

function Handle({
  at,
  hit,
  knob,
  label,
  orientation,
  min,
  max,
  now,
  text,
  onPointerDown,
  onPointerMove,
  onKeyDown,
}: {
  at: Point;
  hit: number;
  knob: number;
  label: string;
  orientation: "horizontal" | "vertical";
  min: number;
  max: number;
  now: number;
  text: string;
  onPointerDown: (event: ReactPointerEvent<SVGGElement>) => void;
  onPointerMove: (event: ReactPointerEvent<SVGGElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<SVGGElement>) => void;
}) {
  return (
    <g
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation={orientation}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={now}
      aria-valuetext={text}
      className="group cursor-grab outline-none focus-visible:outline-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
    >
      <circle cx={at.x} cy={at.y} r={hit} fill="transparent" />
      <circle
        cx={at.x}
        cy={at.y}
        r={knob}
        fill="var(--accent)"
        stroke="var(--surface)"
        strokeWidth={knob * 0.34}
        className="group-focus-visible:stroke-secondary"
      />
    </g>
  );
}

export function Pythagoras() {
  const [mode, setMode] = useState<LabMode>("explore");
  const [a, setA] = useState<number>(EXPLORE_LEGS.a);
  const [b, setB] = useState<number>(EXPLORE_LEGS.b);
  const [snap, setSnap] = useState(true);
  const [why, setWhy] = useState(false);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<CheckStatus>("pending");
  const puzzle = mode === "missing" ? PUZZLES[puzzleIndex] : null;
  const measures = measure(a, b);
  const triple = matchingTriple(a, b);
  const sentence = describePythagoras({
    mode,
    measures,
    why,
    puzzle,
    status,
    tripleName: triple?.name ?? null,
  });
  const hideHypotenuse = mode === "missing" && puzzle?.missing === "c" && status !== "correct";
  const holds = identityHolds(measures) && !hideHypotenuse;
  const parts = equationParts(measures.a2, measures.b2, measures.c2);

  const selectMode = (next: LabMode) => {
    setMode(next);
    setStatus("pending");
    setGuess("");
    setWhy(false);
    if (next === "missing") {
      const start = puzzleStart(PUZZLES[0]);
      setPuzzleIndex(0);
      setA(start.a);
      setB(start.b);
      setSnap(true);
      return;
    }
    setA(EXPLORE_LEGS.a);
    setB(EXPLORE_LEGS.b);
    setSnap(true);
  };

  const selectTriple = (id: TripleId) => {
    const next = TRIPLES.find((item) => item.id === id);
    if (!next) return;
    setA(next.a);
    setB(next.b);
    setSnap(true);
  };

  const loadPuzzle = (index: number) => {
    const next = PUZZLES[index];
    const start = puzzleStart(next);
    setPuzzleIndex(index);
    setA(start.a);
    setB(start.b);
    setGuess("");
    setStatus("pending");
    setSnap(true);
  };

  const changeA = (value: number) => {
    const next = clampLeg(value, snap);
    setA(next);
    if (puzzle?.missing === "a") {
      const matched = answerMatches(next, puzzleAnswer(puzzle));
      setStatus(matched ? "correct" : "pending");
      if (matched) setGuess(formatMeasure(puzzleAnswer(puzzle)));
    }
  };

  const changeB = (value: number) => {
    const next = clampLeg(value, snap);
    setB(next);
    if (puzzle?.missing === "b") {
      const matched = answerMatches(next, puzzleAnswer(puzzle));
      setStatus(matched ? "correct" : "pending");
      if (matched) setGuess(formatMeasure(puzzleAnswer(puzzle)));
    }
  };

  const toggleSnap = () => {
    const next = !snap;
    setSnap(next);
    if (next) {
      setA((value) => clampLeg(value, true));
      setB((value) => clampLeg(value, true));
    }
  };

  const reset = () => {
    setWhy(false);
    setStatus("pending");
    setGuess("");
    if (mode === "missing") {
      const start = puzzleStart(PUZZLES[puzzleIndex]);
      setA(start.a);
      setB(start.b);
      setSnap(true);
      return;
    }
    setA(EXPLORE_LEGS.a);
    setB(EXPLORE_LEGS.b);
    setSnap(true);
  };

  const check = () => {
    if (!puzzle) return;
    const typed = Number.parseFloat(guess);
    const fallback = puzzle.missing === "a" ? a : puzzle.missing === "b" ? b : Number.NaN;
    const input = guess.trim() === "" ? fallback : typed;
    const grade = gradeAnswer(input, puzzle);
    setStatus(grade);
    if (grade === "correct") {
      setA(puzzle.a);
      setB(puzzle.b);
      setGuess(formatMeasure(puzzleAnswer(puzzle)));
    }
  };

  const reveal = () => {
    if (!puzzle) return;
    setA(puzzle.a);
    setB(puzzle.b);
    setGuess(formatMeasure(puzzleAnswer(puzzle)));
    setStatus("correct");
  };

  const onGuess = (value: string) => {
    if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) return;
    setGuess(value);
    if (status === "wrong" || status === "area") setStatus("pending");
  };

  return (
    <div data-tool="pythagoras">
      <MathLabFrame
        label="Pythagoras lab"
        toolbar={
          <>
            <div role="group" aria-label="Mode" className="flex flex-wrap gap-2">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={pillClass(mode === item.id)}
                  aria-pressed={mode === item.id}
                  onClick={() => selectMode(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className={pillClass(snap)} aria-pressed={snap} onClick={toggleSnap}>
              Whole numbers
            </button>
            <button type="button" className={pillClass(why)} aria-pressed={why} onClick={() => setWhy((value) => !value)}>
              {why ? "Hide why" : "Show why"}
            </button>
            <button type="button" className="snap-btn-secondary" onClick={reset}>
              Reset
            </button>
          </>
        }
      >
        <PythagorasStage
          mode={mode}
          a={a}
          b={b}
          snap={snap}
          why={why}
          puzzleIndex={puzzleIndex}
          guess={guess}
          status={status}
          sentence={sentence}
          holds={holds}
          hideHypotenuse={hideHypotenuse}
          parts={parts}
          tripleId={triple?.id ?? ""}
          onA={changeA}
          onB={changeB}
          onTriple={selectTriple}
          onGuess={onGuess}
          onCheck={check}
          onReveal={reveal}
          onNext={() => loadPuzzle((puzzleIndex + 1) % PUZZLES.length)}
          onReset={reset}
        />
      </MathLabFrame>
    </div>
  );
}

function PythagorasStage({
  mode,
  a,
  b,
  snap,
  why,
  puzzleIndex,
  guess,
  status,
  sentence,
  holds,
  hideHypotenuse,
  parts,
  tripleId,
  onA,
  onB,
  onTriple,
  onGuess,
  onCheck,
  onReveal,
  onNext,
  onReset,
}: {
  mode: LabMode;
  a: number;
  b: number;
  snap: boolean;
  why: boolean;
  puzzleIndex: number;
  guess: string;
  status: CheckStatus;
  sentence: string;
  holds: boolean;
  hideHypotenuse: boolean;
  parts: { a2: string; b2: string; c2: string };
  tripleId: string;
  onA: (value: number) => void;
  onB: (value: number) => void;
  onTriple: (id: TripleId) => void;
  onGuess: (value: string) => void;
  onCheck: () => void;
  onReveal: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const hintId = useId();
  const puzzle = mode === "missing" ? PUZZLES[puzzleIndex] : null;
  const model = figure(a, b);
  const lockA = legLocked(mode, puzzle, "a");
  const lockB = legLocked(mode, puzzle, "b");
  const prompt = modePrompt(mode, puzzle);
  const tone =
    status === "correct" ? "text-ok" : status === "wrong" || status === "area" ? "text-bad" : "text-ink";
  const [seen, setSeen] = useState(status);
  const [popKey, setPopKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  if (seen !== status) {
    setSeen(status);
    if (status === "correct") setPopKey((value) => value + 1);
    if (status === "wrong" || status === "area") setShakeKey((value) => value + 1);
  }

  const reset = useCallback(() => {
    onReset();
  }, [onReset]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (projector) {
        exit();
        return;
      }
      reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, projector, reset]);

  const answerLabel = puzzle?.missing === "a" ? "Leg a" : puzzle?.missing === "b" ? "Leg b" : "Hypotenuse c";
  const showPresets = mode === "explore" || mode === "triples";

  return (
    <div className="no-print" data-mode={mode} data-status={status}>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
      <div className="min-w-0 xl:order-1">
      <p className="max-w-3xl text-base leading-relaxed text-ink sm:text-lg">{prompt}</p>
      <div className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-4">
        <Stat label="a" value={formatMeasure(a)} large={projector} name="a" tone="a" />
        <Stat label="b" value={formatMeasure(b)} large={projector} name="b" tone="b" />
        <Stat
          label="c"
          value={hideHypotenuse ? "?" : formatMeasure(model.measures.c)}
          large={projector}
          name="c"
          tone="c"
        />
      </div>
      <div
        key={popKey}
        data-equation={hideHypotenuse ? `${parts.a2} + ${parts.b2} = ?` : equationText(model.measures)}
        data-holds={holds ? "true" : "false"}
        className={`mt-5 flex flex-wrap items-center gap-3 ${popKey > 0 ? "animate-pop motion-reduce:animate-none" : ""}`}
      >
        <AreaChip label="a²" value={parts.a2} tone="a" large={projector} />
        <span className="font-display text-3xl text-ink">+</span>
        <AreaChip label="b²" value={parts.b2} tone="b" large={projector} />
        <span className={`font-display text-3xl ${holds ? "text-ok" : "text-ink"}`}>=</span>
        <AreaChip label="c²" value={hideHypotenuse ? "?" : parts.c2} tone="c" large={projector} />
        {holds ? (
          <span className="inline-flex min-h-11 items-center rounded-full bg-ok-soft px-3 text-sm font-semibold text-ok">
            Holds
          </span>
        ) : null}
      </div>
      <p className={`mt-4 max-w-3xl text-base leading-relaxed sm:text-lg ${tone}`} aria-live="polite" aria-atomic="true">
        {sentence}
      </p>

      {showPresets ? (
        <div role="group" aria-label="Pythagorean triples" className="mt-4 flex flex-wrap gap-2">
          {TRIPLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={pillClass(tripleId === item.id)}
              aria-pressed={tripleId === item.id}
              onClick={() => onTriple(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}

      {puzzle ? (
        <div
          key={shakeKey}
          className={`mt-4 flex flex-wrap items-end gap-3 ${
            shakeKey > 0 ? "animate-shake motion-reduce:animate-none" : ""
          }`}
        >
          <label className="block">
            <span className="text-sm font-semibold text-ink">{answerLabel}</span>
            <input
              value={guess}
              onChange={(event) => onGuess(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onCheck();
              }}
              inputMode="decimal"
              className="snap-input mt-1 w-36 text-center font-display text-2xl tabular-nums"
              aria-label={answerLabel}
              aria-invalid={status === "wrong" || status === "area"}
              aria-describedby={hintId}
            />
          </label>
          <button type="button" className="snap-btn" onClick={onCheck}>
            Check
          </button>
          <button type="button" className="snap-btn-secondary" onClick={onReveal}>
            Show answer
          </button>
          <button type="button" className="snap-btn-secondary" onClick={onNext}>
            Next puzzle
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        {lockA ? null : (
          <Stepper
            label="Leg a"
            value={formatMeasure(a)}
            min={LEG_MIN}
            max={LEG_MAX}
            onChange={(direction) => onA(stepLeg(a, direction, snap))}
          />
        )}
        {lockB ? null : (
          <Stepper
            label="Leg b"
            value={formatMeasure(b)}
            min={LEG_MIN}
            max={LEG_MAX}
            onChange={(direction) => onB(stepLeg(b, direction, snap))}
          />
        )}
      </div>

      {why ? (
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted">
          The square on the hypotenuse splits into two rectangles. One matches the square on a. The other matches the square on b.
        </p>
      ) : null}

      <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-muted" aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-7 border border-secondary bg-secondary-soft" />
          Square on a
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-7 border border-ink bg-accent-soft" />
          Square on b
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-7 border-2 border-ink bg-surface" />
          Square on c
        </span>
      </p>
      <p id={hintId} className="mt-2 max-w-3xl text-sm text-ink-muted">
        The right angle stays fixed. Drag the other corners, or use plus and minus. Arrows move a focused corner.
        Whole numbers snaps the legs. Show why splits the big square into the two leg areas. Escape clears.
      </p>
      </div>
      <div className="snap-panel order-first xl:sticky xl:top-4 xl:order-2">
        <TriangleFigure
          model={model}
          why={why}
          snap={snap}
          lockA={lockA}
          lockB={lockB}
          hideHypotenuse={hideHypotenuse}
          areaA={parts.a2}
          areaB={parts.b2}
          areaC={parts.c2}
          onA={onA}
          onB={onB}
        />
      </div>
      </div>
    </div>
  );
}
