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
  followIntercept,
  gridTicks,
  initialPoint,
  lineReadout,
  linesMatch,
  nudgeSlopePoint,
  openingFor,
  placeIntercept,
  placeSlopePoint,
  pointFromSlope,
  pointList,
  snapHandles,
  stepIntercept,
  stepSlopePoint,
  type LabMode,
  type LineReadout,
  type PlanePoint,
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
  onNudgePoint,
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
  onNudgePoint: (dx: number, dy: number) => void;
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
  const slopePoint = handled.point;

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
    const move: Record<string, [number, number]> = {
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
    };
    const step = move[event.key];
    if (!step) return;
    event.preventDefault();
    onNudgePoint(step[0], step[1]);
  };

  const marker =
    triangle && triangle.showRise && Math.abs(triangle.rise) > 0.7 && Math.abs(triangle.run) > 0.7
      ? (() => {
          const size = 0.32;
          const towardIntercept = Math.sign(triangle.x1 - triangle.x2) || 1;
          const towardPoint = Math.sign(triangle.rise) || 1;
          return [
            { x: triangle.x2 + towardIntercept * size, y: triangle.y2 },
            { x: triangle.x2 + towardIntercept * size, y: triangle.y2 + towardPoint * size },
            { x: triangle.x2, y: triangle.y2 + towardPoint * size },
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
      ? (() => {
          const outward = triangle.x2 >= 0 ? 0.72 : -0.72;
          let x = triangle.x2 + outward;
          if (x > PLANE - 0.4) x = triangle.x2 - 0.72;
          if (x < -PLANE + 0.4) x = triangle.x2 + 0.72;
          return { x, y: (triangle.y2 + triangle.y3) / 2 };
        })()
      : null;

  return (
    <svg
      viewBox={VIEW}
      className="mx-auto h-auto w-full max-w-3xl touch-none select-none"
      role="group"
      aria-labelledby={titleId}
      data-dragging={dragging ?? ""}
    >
      <title id={titleId}>{`Coordinate plane showing ${handled.equation}`}</title>
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
          aria-label={snap ? "Line point, snapped to a whole-number grid point" : "Line point"}
          aria-valuemin={-PLANE}
          aria-valuemax={PLANE}
          aria-valuenow={Number(handled.point.y.toFixed(2))}
          aria-valuetext={
            handled.vertical
              ? `Undefined slope. Vertical line, ${handled.equationSpoken}.`
              : `Point (${handled.point.x}, ${handled.point.y}). Slope ${handled.slopeSpoken}. ${handled.equationSpoken}.`
          }
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
        Drag the point on the y-axis to change the intercept. Drag the point with the blue center anywhere on the grid, including left and below.
        Arrow keys move the focused point. On the y-axis the slope is undefined.
      </desc>
    </svg>
  );
}

export function SlopeIntercept() {
  const [mode, setMode] = useState<LabMode>("explore");
  const [snap, setSnap] = useState(true);
  const [showTriangle, setShowTriangle] = useState(true);
  const [which, setWhich] = useState<"a" | "b">("a");
  const [b, setB] = useState(START_B);
  const [point, setPoint] = useState<PlanePoint>(() => initialPoint(START_M, START_B));
  const [b2, setB2] = useState(COMPARE_B);
  const [point2, setPoint2] = useState<PlanePoint>(() => initialPoint(COMPARE_M, COMPARE_B));
  const [matchIndex, setMatchIndex] = useState(0);

  const editingB = mode === "compare" && which === "b";
  const bRef = useRef(b);
  const pointRef = useRef(point);
  const b2Ref = useRef(b2);
  const point2Ref = useRef(point2);
  bRef.current = b;
  pointRef.current = point;
  b2Ref.current = b2;
  point2Ref.current = point2;

  const commitLine = useCallback((whichLine: "a" | "b", nextB: number, nextPoint: PlanePoint) => {
    if (whichLine === "b") {
      b2Ref.current = nextB;
      point2Ref.current = nextPoint;
      setB2(nextB);
      setPoint2(nextPoint);
      return;
    }
    bRef.current = nextB;
    pointRef.current = nextPoint;
    setB(nextB);
    setPoint(nextPoint);
  }, []);

  const onIntercept = useCallback(
    (pointerY: number) => {
      const whichLine = editingB ? "b" : "a";
      const current = editingB ? point2Ref.current : pointRef.current;
      const prevB = editingB ? b2Ref.current : bRef.current;
      const nextB = placeIntercept(pointerY, snap, current);
      commitLine(whichLine, nextB, followIntercept(current, prevB, nextB, snap));
    },
    [commitLine, editingB, snap],
  );

  const onSlope = useCallback(
    (pointerX: number, pointerY: number) => {
      const whichLine = editingB ? "b" : "a";
      const intercept = editingB ? b2Ref.current : bRef.current;
      const next = placeSlopePoint(pointerX, pointerY, intercept, snap);
      commitLine(whichLine, intercept, next);
    },
    [commitLine, editingB, snap],
  );

  const onStepIntercept = useCallback(
    (direction: -1 | 1) => {
      const whichLine = editingB ? "b" : "a";
      const current = editingB ? point2Ref.current : pointRef.current;
      const prevB = editingB ? b2Ref.current : bRef.current;
      const nextB = placeIntercept(stepIntercept(prevB, direction, snap), snap, current, direction);
      commitLine(whichLine, nextB, followIntercept(current, prevB, nextB, snap));
    },
    [commitLine, editingB, snap],
  );

  const onStepSlope = useCallback(
    (direction: -1 | 1) => {
      const whichLine = editingB ? "b" : "a";
      const current = editingB ? point2Ref.current : pointRef.current;
      const intercept = editingB ? b2Ref.current : bRef.current;
      commitLine(whichLine, intercept, stepSlopePoint(current, intercept, direction, snap));
    },
    [commitLine, editingB, snap],
  );

  const onNudgePoint = useCallback(
    (dx: number, dy: number) => {
      const whichLine = editingB ? "b" : "a";
      const current = editingB ? point2Ref.current : pointRef.current;
      const intercept = editingB ? b2Ref.current : bRef.current;
      commitLine(whichLine, intercept, nudgeSlopePoint(current, intercept, dx, dy, snap));
    },
    [commitLine, editingB, snap],
  );

  const onSliderM = useCallback(
    (next: number) => {
      const whichLine = editingB ? "b" : "a";
      const current = editingB ? point2Ref.current : pointRef.current;
      const intercept = editingB ? b2Ref.current : bRef.current;
      commitLine(whichLine, intercept, pointFromSlope(next, intercept, current.x, snap));
    },
    [commitLine, editingB, snap],
  );

  const onSliderB = useCallback(
    (next: number) => {
      onIntercept(next);
    },
    [onIntercept],
  );

  const toggleSnap = () => {
    const next = !snap;
    setSnap(next);
    if (!next) return;
    const lineA = snapHandles(b, point);
    const lineB = snapHandles(b2, point2);
    setB(lineA.b);
    setPoint(lineA.point);
    setB2(lineB.b);
    setPoint2(lineB.point);
  };

  const selectMode = (next: LabMode) => {
    setMode(next);
    setWhich("a");
    if (next !== "match") return;
    const target = MATCH_TARGETS[0];
    const opening = openingFor(target);
    setMatchIndex(0);
    setB(opening.b);
    setPoint(initialPoint(opening.m, opening.b));
  };

  const nextTarget = () => {
    const next = (matchIndex + 1) % MATCH_TARGETS.length;
    const opening = openingFor(MATCH_TARGETS[next]);
    setMatchIndex(next);
    setB(opening.b);
    setPoint(initialPoint(opening.m, opening.b));
  };

  const reset = useCallback(() => {
    setMode("explore");
    setSnap(true);
    setShowTriangle(true);
    setWhich("a");
    setB(START_B);
    setPoint(initialPoint(START_M, START_B));
    setB2(COMPARE_B);
    setPoint2(initialPoint(COMPARE_M, COMPARE_B));
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
          b={b}
          point={point}
          b2={b2}
          point2={point2}
          matchIndex={matchIndex}
          onWhich={setWhich}
          onIntercept={onIntercept}
          onSlope={onSlope}
          onStepIntercept={onStepIntercept}
          onStepSlope={onStepSlope}
          onNudgePoint={onNudgePoint}
          onSliderM={onSliderM}
          onSliderB={onSliderB}
          onReset={reset}
        />
      </MathLabFrame>
    </div>
  );
}

function pointsDiffer(left: PlanePoint, right: PlanePoint) {
  return Math.abs(left.x - right.x) > 1e-9 || Math.abs(left.y - right.y) > 1e-9;
}

function SlopeStage({
  mode,
  snap,
  showTriangle,
  which,
  b,
  point,
  b2,
  point2,
  matchIndex,
  onWhich,
  onIntercept,
  onSlope,
  onStepIntercept,
  onStepSlope,
  onNudgePoint,
  onSliderM,
  onSliderB,
  onReset,
}: {
  mode: LabMode;
  snap: boolean;
  showTriangle: boolean;
  which: "a" | "b";
  b: number;
  point: PlanePoint;
  b2: number;
  point2: PlanePoint;
  matchIndex: number;
  onWhich: (which: "a" | "b") => void;
  onIntercept: (pointerY: number) => void;
  onSlope: (pointerX: number, pointerY: number) => void;
  onStepIntercept: (direction: -1 | 1) => void;
  onStepSlope: (direction: -1 | 1) => void;
  onNudgePoint: (dx: number, dy: number) => void;
  onSliderM: (value: number) => void;
  onSliderB: (value: number) => void;
  onReset: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const slopeId = useId();
  const interceptId = useId();
  const lineA = lineReadout(b, point);
  const lineB = lineReadout(b2, point2);
  const target = MATCH_TARGETS[matchIndex] ?? MATCH_TARGETS[0];
  const targetLine = lineReadout(target.b, initialPoint(target.m, target.b));
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
        : "Drag the point on the y-axis, or the blue point anywhere on the grid.";

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

  const activePoint = editingB ? point2 : point;
  const interceptNow = editingB ? b2 : b;
  const slopeNow = active.m ?? 0;
  const canDecreaseSlope = pointsDiffer(stepSlopePoint(activePoint, interceptNow, -1, snap), activePoint);
  const canIncreaseSlope = pointsDiffer(stepSlopePoint(activePoint, interceptNow, 1, snap), activePoint);
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
      data-run={active.triangle?.runText ?? (active.vertical ? "0" : "")}
      data-vertical={active.vertical ? "true" : "false"}
      data-point-x={active.point.x}
      data-point-y={active.point.y}
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
          onNudgePoint={onNudgePoint}
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
              value={Math.min(M_MAX, Math.max(M_MIN, slopeNow))}
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
              step={snap ? 1 : 0.1}
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
        Drag either point, or use the sliders. Arrows move the focused point. A point on the y-axis makes a vertical line. Escape {projector ? "leaves full screen" : "resets the lab"}.
      </p>
    </div>
  );
}
