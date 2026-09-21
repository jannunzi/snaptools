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
  B_MAX,
  B_MIN,
  COMPARE_B,
  COMPARE_M,
  MATCH_TARGETS,
  M_MAX,
  M_MIN,
  PLANE,
  START_B,
  START_M,
  gridTicks,
  interceptFromPoint,
  lineReadout,
  linesMatch,
  openingFor,
  pointList,
  preferredRun,
  slopeFromPoint,
  snapSlope,
  stepIntercept,
  stepSlope,
  visibleRun,
  type LabMode,
  type LineReadout,
} from "@/lib/slope-intercept";

const PAD = 1.9;
const VIEW = `${-PLANE - PAD} ${-PLANE - PAD} ${(PLANE + PAD) * 2} ${(PLANE + PAD) * 2}`;
const TICKS = gridTicks();
const MODES: { id: LabMode; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "compare", label: "Compare" },
  { id: "match", label: "Match" },
];

function pillClass(active: boolean) {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-3.5 text-sm font-semibold ${
    active ? "border-ink bg-accent text-accent-ink" : "border-line bg-surface text-ink hover:border-ink"
  }`;
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

function DiagramText({
  x,
  y,
  fill,
  size = 0.4,
  anchor = "middle",
  children,
}: {
  x: number;
  y: number;
  fill: string;
  size?: number;
  anchor?: "middle" | "end" | "start";
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontSize={size}
      fill={fill}
      fontWeight={600}
      fontFamily="inherit"
      stroke="var(--surface)"
      strokeWidth={size * 0.38}
      strokeLinejoin="round"
      style={{ paintOrder: "stroke" }}
    >
      {children}
    </text>
  );
}

function Stat({
  label,
  value,
  large,
  tone = "ink",
}: {
  label: string;
  value: string;
  large: boolean;
  tone?: "ink" | "blue";
}) {
  const color = tone === "blue" ? "text-secondary" : "text-ink";
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone === "blue" ? "text-secondary" : "text-ink-muted"}`}>
        {label}
      </p>
      <p className={`font-display tabular-nums leading-none ${color} ${large ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"}`}>
        {value}
      </p>
    </div>
  );
}

function Stepper({
  label,
  value,
  decreaseLabel,
  increaseLabel,
  canDecrease,
  canIncrease,
  onStep,
}: {
  label: string;
  value: string;
  decreaseLabel: string;
  increaseLabel: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onStep: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <span className="w-16 text-sm font-semibold text-ink">{label}</span>
      <button
        type="button"
        className="snap-btn-secondary min-w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={decreaseLabel}
        disabled={!canDecrease}
        onClick={() => onStep(-1)}
      >
        −
      </button>
      <span className="min-w-16 text-center font-display text-2xl tabular-nums text-ink">{value}</span>
      <button
        type="button"
        className="snap-btn-secondary min-w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={() => onStep(1)}
      >
        +
      </button>
    </div>
  );
}

function LinePath({
  line,
  color,
  dashed,
  width = 2.75,
}: {
  line: LineReadout;
  color: string;
  dashed?: boolean;
  width?: number;
}) {
  if (!line.segment) return null;
  return (
    <line
      x1={line.segment.x1}
      y1={line.segment.y1}
      x2={line.segment.x2}
      y2={line.segment.y2}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dashed ? "0.46 0.34" : undefined}
      vectorEffect="non-scaling-stroke"
      pointerEvents="none"
    />
  );
}

function PlaneFigure({
  lineA,
  lineB,
  target,
  edit,
  showTriangle,
  snap,
  onIntercept,
  onSlope,
  onStepIntercept,
  onStepSlope,
  onStepRun,
}: {
  lineA: LineReadout;
  lineB: LineReadout | null;
  target: LineReadout | null;
  edit: "a" | "b";
  showTriangle: boolean;
  snap: boolean;
  onIntercept: (pointerY: number) => void;
  onSlope: (pointerX: number, pointerY: number) => void;
  onStepIntercept: (direction: -1 | 1) => void;
  onStepSlope: (direction: -1 | 1) => void;
  onStepRun: (direction: -1 | 1) => void;
}) {
  const groupRef = useRef<SVGGElement>(null);
  const interceptRef = useRef<SVGGElement>(null);
  const slopeRef = useRef<SVGGElement>(null);
  const titleId = useId();
  const hintId = useId();
  const [dragging, setDragging] = useState<"intercept" | "slope" | null>(null);
  const handled = edit === "b" && lineB ? lineB : lineA;
  const triangle = showTriangle ? handled.triangle : null;
  const intercept = { x: 0, y: handled.b };
  const slopePoint = triangle
    ? { x: triangle.x3, y: triangle.y3 }
    : { x: handled.run, y: handled.b + handled.m * handled.run };

  const readPoint = (clientX: number, clientY: number) => {
    const group = groupRef.current;
    if (!group) return null;
    return clientToMath(group, clientX, clientY);
  };

  const onInterceptDown = (event: ReactPointerEvent<SVGGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    interceptRef.current?.focus();
    setDragging("intercept");
    const point = readPoint(event.clientX, event.clientY);
    if (point) onIntercept(point.y);
  };

  const onSlopeDown = (event: ReactPointerEvent<SVGGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    slopeRef.current?.focus();
    setDragging("slope");
    const point = readPoint(event.clientX, event.clientY);
    if (point) onSlope(point.x, point.y);
  };

  const onInterceptMove = (event: ReactPointerEvent<SVGGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const point = readPoint(event.clientX, event.clientY);
    if (point) onIntercept(point.y);
  };

  const onSlopeMove = (event: ReactPointerEvent<SVGGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const point = readPoint(event.clientX, event.clientY);
    if (point) onSlope(point.x, point.y);
  };

  const onPointerUp = (event: ReactPointerEvent<SVGGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(null);
  };

  const onInterceptKey = (event: ReactKeyboardEvent<SVGGElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    onStepIntercept(event.key === "ArrowUp" ? 1 : -1);
  };

  const onSlopeKey = (event: ReactKeyboardEvent<SVGGElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onStepSlope(event.key === "ArrowUp" ? 1 : -1);
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      onStepRun(event.key === "ArrowRight" ? 1 : -1);
    }
  };

  const marker =
    triangle && triangle.showRise && Math.abs(triangle.rise) > 0.7 && triangle.run > 0.7
      ? (() => {
          const size = 0.32;
          const up = Math.sign(triangle.rise) * size;
          const left = triangle.x2 - size;
          return [
            { x: left, y: triangle.y2 },
            { x: left, y: triangle.y2 + up },
            { x: triangle.x2, y: triangle.y2 + up },
          ];
        })()
      : null;

  const runLabel = triangle
    ? {
        x: (triangle.x1 + triangle.x2) / 2,
        y: triangle.y1 <= -PLANE + 1.3 ? triangle.y1 + 0.62 : triangle.y1 - 0.62,
      }
    : null;
  const riseLabel =
    triangle && triangle.showRise
      ? {
          x: triangle.x2 > PLANE - 1.3 ? triangle.x2 - 0.72 : triangle.x2 + 0.72,
          y: (triangle.y2 + triangle.y3) / 2,
        }
      : null;

  return (
    <svg
      viewBox={VIEW}
      className="mx-auto h-auto w-full max-w-3xl touch-none select-none"
      role="group"
      aria-labelledby={titleId}
      data-dragging={dragging ?? ""}
    >
      <title id={titleId}>Coordinate plane showing {handled.equation}</title>
      <g
        ref={groupRef}
        transform="scale(1,-1)"
        className={dragging ? "cursor-grabbing" : undefined}
      >
        <rect x={-PLANE} y={-PLANE} width={PLANE * 2} height={PLANE * 2} fill="var(--surface)" />
        <g aria-hidden="true" pointerEvents="none">
          {TICKS.map((tick) => (
            <g key={tick}>
              <line
                x1={tick}
                y1={-PLANE}
                x2={tick}
                y2={PLANE}
                stroke={tick === 0 ? "var(--ink)" : "var(--line)"}
                strokeWidth={tick === 0 ? 1.75 : 1}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={-PLANE}
                y1={tick}
                x2={PLANE}
                y2={tick}
                stroke={tick === 0 ? "var(--ink)" : "var(--line)"}
                strokeWidth={tick === 0 ? 1.75 : 1}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </g>
        {target ? <LinePath line={target} color="var(--secondary)" dashed width={2.5} /> : null}
        {edit === "b" ? <LinePath line={lineA} color="var(--ink)" width={2.5} /> : null}
        {edit === "a" && lineB ? <LinePath line={lineB} color="var(--secondary)" width={2.5} /> : null}
        {triangle ? (
          <g pointerEvents="none" aria-hidden="true">
            <polygon
              points={pointList([
                { x: triangle.x1, y: triangle.y1 },
                { x: triangle.x2, y: triangle.y2 },
                { x: triangle.x3, y: triangle.y3 },
              ])}
              fill="var(--secondary-soft)"
            />
            <line
              x1={triangle.x1}
              y1={triangle.y1}
              x2={triangle.x2}
              y2={triangle.y2}
              stroke="var(--secondary)"
              strokeWidth={3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {triangle.showRise ? (
              <line
                x1={triangle.x2}
                y1={triangle.y2}
                x2={triangle.x3}
                y2={triangle.y3}
                stroke="var(--ink)"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {marker ? (
              <polyline
                points={pointList(marker)}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </g>
        ) : null}
        {edit === "b" && lineB ? (
          <LinePath line={lineB} color="var(--secondary)" />
        ) : (
          <LinePath line={lineA} color="var(--ink)" />
        )}
        <g
          ref={interceptRef}
          role="slider"
          tabIndex={0}
          aria-label="Y-intercept"
          aria-orientation="vertical"
          aria-valuemin={B_MIN}
          aria-valuemax={B_MAX}
          aria-valuenow={Number(handled.b.toFixed(2))}
          aria-valuetext={`intercept ${handled.interceptSpoken}, ${handled.equationSpoken}`}
          aria-describedby={hintId}
          className="group cursor-grab outline-none"
          onPointerDown={onInterceptDown}
          onPointerMove={onInterceptMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onInterceptKey}
        >
          <circle cx={intercept.x} cy={intercept.y} r={0.78} fill="transparent" />
          <circle
            cx={intercept.x}
            cy={intercept.y}
            r={0.3}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={0.08}
            className="pointer-events-none group-focus-visible:stroke-secondary"
          />
        </g>
        <g
          ref={slopeRef}
          role="slider"
          tabIndex={0}
          aria-label={snap ? "Slope handle, snapped to a simple fraction" : "Slope handle"}
          aria-orientation="vertical"
          aria-valuemin={M_MIN}
          aria-valuemax={M_MAX}
          aria-valuenow={Number(handled.m.toFixed(2))}
          aria-valuetext={`slope ${handled.slopeSpoken}, ${handled.equationSpoken}`}
          aria-describedby={hintId}
          className="group cursor-grab outline-none"
          onPointerDown={onSlopeDown}
          onPointerMove={onSlopeMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onSlopeKey}
        >
          <circle cx={slopePoint.x} cy={slopePoint.y} r={0.78} fill="transparent" />
          <circle
            cx={slopePoint.x}
            cy={slopePoint.y}
            r={0.3}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={0.08}
            className="pointer-events-none group-focus-visible:stroke-secondary"
          />
          <circle cx={slopePoint.x} cy={slopePoint.y} r={0.09} fill="var(--secondary)" className="pointer-events-none" />
        </g>
      </g>
      <g pointerEvents="none" aria-hidden="true">
        {TICKS.filter((tick) => tick !== 0 && tick % 2 === 0).map((tick) => (
          <DiagramText key={`x-${tick}`} x={tick} y={PLANE + 0.62} fill="var(--ink-muted)" size={0.38}>
            {String(tick)}
          </DiagramText>
        ))}
        {TICKS.filter((tick) => tick !== 0 && tick % 2 === 0).map((tick) => (
          <DiagramText key={`y-${tick}`} x={-PLANE - 0.28} y={-tick} fill="var(--ink-muted)" size={0.38} anchor="end">
            {String(tick)}
          </DiagramText>
        ))}
        <DiagramText x={PLANE - 0.35} y={0.58} fill="var(--ink)" size={0.42} anchor="end">
          x
        </DiagramText>
        <DiagramText x={0.48} y={-(PLANE - 0.4)} fill="var(--ink)" size={0.42} anchor="start">
          y
        </DiagramText>
        {runLabel ? (
          <DiagramText x={runLabel.x} y={-runLabel.y} fill="var(--secondary)" size={0.4}>
            {`run ${triangle?.runText ?? ""}`}
          </DiagramText>
        ) : null}
        {riseLabel && triangle ? (
          <DiagramText x={riseLabel.x} y={-riseLabel.y} fill="var(--ink)" size={0.4}>
            {`rise ${triangle.riseText}`}
          </DiagramText>
        ) : null}
      </g>
      <desc id={hintId}>
        Drag the point on the y-axis to change the intercept. Drag the point with the blue center to change the slope.
        Arrow keys step the focused point. Left and right arrows on the slope point change the run.
      </desc>
    </svg>
  );
}

export function SlopeIntercept() {
  const [mode, setMode] = useState<LabMode>("explore");
  const [snap, setSnap] = useState(true);
  const [showTriangle, setShowTriangle] = useState(true);
  const [which, setWhich] = useState<"a" | "b">("a");
  const [m, setM] = useState(START_M);
  const [b, setB] = useState(START_B);
  const [run, setRun] = useState(preferredRun(START_M));
  const [m2, setM2] = useState(COMPARE_M);
  const [b2, setB2] = useState(COMPARE_B);
  const [run2, setRun2] = useState(preferredRun(COMPARE_M));
  const [matchIndex, setMatchIndex] = useState(0);

  const editingB = mode === "compare" && which === "b";

  const applyM = useCallback(
    (next: number, nextRun?: number) => {
      if (editingB) {
        setM2(next);
        setRun2(nextRun ?? preferredRun(next));
        return;
      }
      setM(next);
      setRun(nextRun ?? preferredRun(next));
    },
    [editingB],
  );

  const applyB = useCallback(
    (next: number) => {
      if (editingB) setB2(next);
      else setB(next);
    },
    [editingB],
  );

  const onIntercept = useCallback(
    (pointerY: number) => applyB(interceptFromPoint(pointerY, snap)),
    [applyB, snap],
  );

  const onSlope = useCallback(
    (pointerX: number, pointerY: number) => {
      const intercept = editingB ? b2 : b;
      const next = slopeFromPoint(pointerX, pointerY, intercept, snap);
      applyM(next.m, next.run);
    },
    [applyM, b, b2, editingB, snap],
  );

  const onStepIntercept = useCallback(
    (direction: -1 | 1) => {
      const current = editingB ? b2 : b;
      applyB(stepIntercept(current, direction, snap));
    },
    [applyB, b, b2, editingB, snap],
  );

  const onStepSlope = useCallback(
    (direction: -1 | 1) => {
      const current = editingB ? m2 : m;
      applyM(stepSlope(current, direction, snap));
    },
    [applyM, editingB, m, m2, snap],
  );

  const onStepRun = useCallback(
    (direction: -1 | 1) => {
      if (editingB) {
        setRun2(visibleRun(m2, b2, run2 + direction));
        return;
      }
      setRun(visibleRun(m, b, run + direction));
    },
    [b, b2, editingB, m, m2, run, run2],
  );

  const toggleSnap = () => {
    const next = !snap;
    setSnap(next);
    if (!next) return;
    const mA = snapSlope(m);
    const bA = interceptFromPoint(b, true);
    const mB = snapSlope(m2);
    const bB = interceptFromPoint(b2, true);
    setM(mA);
    setB(bA);
    setRun(preferredRun(mA));
    setM2(mB);
    setB2(bB);
    setRun2(preferredRun(mB));
  };

  const selectMode = (next: LabMode) => {
    setMode(next);
    setWhich("a");
    if (next !== "match") return;
    const target = MATCH_TARGETS[0];
    const opening = openingFor(target);
    setMatchIndex(0);
    setM(opening.m);
    setB(opening.b);
    setRun(preferredRun(opening.m));
  };

  const nextTarget = () => {
    const next = (matchIndex + 1) % MATCH_TARGETS.length;
    const opening = openingFor(MATCH_TARGETS[next]);
    setMatchIndex(next);
    setM(opening.m);
    setB(opening.b);
    setRun(preferredRun(opening.m));
  };

  const reset = useCallback(() => {
    setMode("explore");
    setSnap(true);
    setShowTriangle(true);
    setWhich("a");
    setM(START_M);
    setB(START_B);
    setRun(preferredRun(START_M));
    setM2(COMPARE_M);
    setB2(COMPARE_B);
    setRun2(preferredRun(COMPARE_M));
    setMatchIndex(0);
  }, []);

  return (
    <div data-tool="slope-intercept">
      <MathLabFrame
        label="Slope intercept lab"
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
              Snap
            </button>
            <button
              type="button"
              className={pillClass(showTriangle)}
              aria-pressed={showTriangle}
              onClick={() => setShowTriangle((value) => !value)}
            >
              Rise/run
            </button>
            {mode === "match" ? (
              <button type="button" className="snap-btn-secondary" onClick={nextTarget}>
                New line
              </button>
            ) : null}
            <button type="button" className="snap-btn-secondary" onClick={reset}>
              Reset
            </button>
          </>
        }
      >
        <SlopeStage
          mode={mode}
          snap={snap}
          showTriangle={showTriangle}
          which={which}
          m={m}
          b={b}
          run={run}
          m2={m2}
          b2={b2}
          run2={run2}
          matchIndex={matchIndex}
          onWhich={setWhich}
          onIntercept={onIntercept}
          onSlope={onSlope}
          onStepIntercept={onStepIntercept}
          onStepSlope={onStepSlope}
          onStepRun={onStepRun}
          onSliderM={(value) => applyM(snap ? snapSlope(value) : value)}
          onSliderB={(value) => applyB(interceptFromPoint(value, snap))}
          onReset={reset}
        />
      </MathLabFrame>
    </div>
  );
}

function SlopeStage({
  mode,
  snap,
  showTriangle,
  which,
  m,
  b,
  run,
  m2,
  b2,
  run2,
  matchIndex,
  onWhich,
  onIntercept,
  onSlope,
  onStepIntercept,
  onStepSlope,
  onStepRun,
  onSliderM,
  onSliderB,
  onReset,
}: {
  mode: LabMode;
  snap: boolean;
  showTriangle: boolean;
  which: "a" | "b";
  m: number;
  b: number;
  run: number;
  m2: number;
  b2: number;
  run2: number;
  matchIndex: number;
  onWhich: (which: "a" | "b") => void;
  onIntercept: (pointerY: number) => void;
  onSlope: (pointerX: number, pointerY: number) => void;
  onStepIntercept: (direction: -1 | 1) => void;
  onStepSlope: (direction: -1 | 1) => void;
  onStepRun: (direction: -1 | 1) => void;
  onSliderM: (value: number) => void;
  onSliderB: (value: number) => void;
  onReset: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const slopeId = useId();
  const interceptId = useId();
  const lineA = lineReadout(m, b, run);
  const lineB = lineReadout(m2, b2, run2);
  const target = MATCH_TARGETS[matchIndex] ?? MATCH_TARGETS[0];
  const targetLine = lineReadout(target.m, target.b, preferredRun(target.m));
  const editingB = mode === "compare" && which === "b";
  const active = editingB ? lineB : lineA;
  const matched = mode === "match" && linesMatch(lineA, targetLine);
  const prompt =
    mode === "match"
      ? matched
        ? `Matched. Both lines are ${lineA.equation}.`
        : "Match the dashed line. Its equation stays hidden until the two agree."
      : mode === "compare"
        ? "Line A is black. Line B is blue. The sliders edit the selected line."
        : "Drag the point on the y-axis, or the point with the blue center.";

  const announcement =
    mode === "match"
      ? matched
        ? `Matched. ${lineA.announcement}`
        : `${lineA.announcement} Match the dashed line.`
      : mode === "compare"
        ? `Line ${editingB ? "B" : "A"}. ${active.announcement}`
        : lineA.announcement;

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

  const slopeNow = editingB ? m2 : m;
  const interceptNow = editingB ? b2 : b;
  const canDecreaseSlope = Math.abs(stepSlope(slopeNow, -1, snap) - slopeNow) > 1e-9;
  const canIncreaseSlope = Math.abs(stepSlope(slopeNow, 1, snap) - slopeNow) > 1e-9;
  const canDecreaseIntercept = Math.abs(stepIntercept(interceptNow, -1, snap) - interceptNow) > 1e-9;
  const canIncreaseIntercept = Math.abs(stepIntercept(interceptNow, 1, snap) - interceptNow) > 1e-9;

  return (
    <div
      className="no-print"
      data-mode={mode}
      data-equation={active.equation}
      data-slope={active.slopeText}
      data-intercept={active.interceptText}
      data-rise={active.triangle?.riseText ?? ""}
      data-run={active.triangle?.runText ?? ""}
      data-matched={matched ? "true" : "false"}
      data-snap={snap ? "true" : "false"}
    >
      <p className="max-w-3xl text-base leading-relaxed text-ink sm:text-lg">{prompt}</p>
      <div className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-4">
        <Stat
          label={editingB ? "Line B" : mode === "compare" ? "Line A" : "Equation"}
          value={active.equation}
          large={projector}
          tone={editingB ? "blue" : "ink"}
        />
        <Stat label="Slope m" value={active.slopeText} large={false} />
        <Stat label="Intercept b" value={active.interceptText} large={false} />
      </div>
      {mode === "compare" ? (
        <p className={`mt-4 font-display text-2xl tabular-nums sm:text-3xl ${editingB ? "text-ink" : "text-secondary"}`}>
          {editingB ? lineA.equation : lineB.equation}
          <span className="ml-3 text-base font-semibold text-ink-muted">{editingB ? "Line A" : "Line B"}</span>
        </p>
      ) : null}
      {mode === "match" ? (
        <p className={`mt-4 text-base font-semibold sm:text-lg ${matched ? "text-ok" : "text-ink"}`}>
          {matched ? "Matched" : "Not yet"}
        </p>
      ) : null}

      <div className="snap-panel mt-5">
        <PlaneFigure
          lineA={lineA}
          lineB={mode === "compare" ? lineB : null}
          target={mode === "match" ? targetLine : null}
          edit={editingB ? "b" : "a"}
          showTriangle={showTriangle}
          snap={snap}
          onIntercept={onIntercept}
          onSlope={onSlope}
          onStepIntercept={onStepIntercept}
          onStepSlope={onStepSlope}
          onStepRun={onStepRun}
        />
      </div>

      <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink sm:text-lg" aria-hidden="true">
        {mode === "match" && !matched ? "Cover the dashed line. " : null}
        {active.caption}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {live}
      </p>

      {mode === "compare" ? (
        <div role="group" aria-label="Line to edit" className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={pillClass(which === "a")} aria-pressed={which === "a"} onClick={() => onWhich("a")}>
            Line A
          </button>
          <button type="button" className={pillClass(which === "b")} aria-pressed={which === "b"} onClick={() => onWhich("b")}>
            Line B
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <Stepper
            label="Slope"
            value={active.slopeText}
            decreaseLabel="Decrease slope"
            increaseLabel="Increase slope"
            canDecrease={canDecreaseSlope}
            canIncrease={canIncreaseSlope}
            onStep={onStepSlope}
          />
          <div className="mt-3 flex h-11 items-center">
            <input
              id={slopeId}
              type="range"
              min={M_MIN}
              max={M_MAX}
              step={snap ? "any" : 0.1}
              value={slopeNow}
              aria-label="Slope m"
              aria-valuetext={active.slopeSpoken}
              className="w-full cursor-pointer"
              style={{ accentColor: "var(--ink)" }}
              onChange={(event) => onSliderM(Number(event.target.value))}
            />
          </div>
        </div>
        <div>
          <Stepper
            label="Intercept"
            value={active.interceptText}
            decreaseLabel="Decrease intercept"
            increaseLabel="Increase intercept"
            canDecrease={canDecreaseIntercept}
            canIncrease={canIncreaseIntercept}
            onStep={onStepIntercept}
          />
          <div className="mt-3 flex h-11 items-center">
            <input
              id={interceptId}
              type="range"
              min={B_MIN}
              max={B_MAX}
              step={snap ? "any" : 0.1}
              value={interceptNow}
              aria-label="Intercept b"
              aria-valuetext={active.interceptSpoken}
              className="w-full cursor-pointer"
              style={{ accentColor: "var(--ink)" }}
              onChange={(event) => onSliderB(Number(event.target.value))}
            />
          </div>
        </div>
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted" aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-7 bg-ink" />
          {mode === "compare" ? "Line A" : "Your line"}
        </span>
        {mode === "compare" ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-7 bg-secondary" />
            Line B
          </span>
        ) : null}
        {mode === "match" ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-px w-7 border-t border-dashed border-secondary" />
            Target
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-7 bg-secondary" />
          Run
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-7 bg-ink" />
          Rise
        </span>
      </p>
      <p className="mt-2 max-w-3xl text-sm text-ink-muted">
        Drag either point, or use the sliders. Arrows step the focused point. Escape {projector ? "leaves full screen" : "resets the lab"}.
      </p>
    </div>
  );
}
