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
  COMMON_ANGLES,
  RATIO_IDS,
  START_RADIANS,
  angleFromPoint,
  arcPoints,
  circleModel,
  circularDistance,
  nudgeDegrees,
  pointList,
  radianLabel,
  radiansOf,
  snapToCommon,
  stepCommon,
  type CircleModel,
  type CommonAngle,
  type PrimaryUnit,
  type RatioId,
} from "@/lib/unit-circle";

const ARC_RADIUS = 0.36;
const LABEL_RADIUS = 1.52;
const THUMB_RADIUS = 0.19;

function pillClass(active: boolean) {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-3.5 text-sm font-semibold ${
    active
      ? "border-ink bg-accent text-accent-ink"
      : "border-line bg-surface text-ink hover:border-ink"
  }`;
}

function DiagramText({
  x,
  y,
  fill,
  size = 0.11,
  children,
}: {
  x: number;
  y: number;
  fill: string;
  size?: number;
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
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
  tone: "primary" | "cos" | "sin";
}) {
  const accent = tone === "cos" ? "text-secondary" : "text-ink";
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone === "primary" ? "text-ink-muted" : accent}`}>
        {label}
      </p>
      <p
        data-stat={name}
        className={`font-display tabular-nums leading-none text-ink ${large ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function CircleFigure({
  model,
  snap,
  unit,
  onAngle,
  onStep,
}: {
  model: CircleModel;
  snap: boolean;
  unit: PrimaryUnit;
  onAngle: (radians: number) => void;
  onStep: (direction: -1 | 1, coarse: boolean) => void;
}) {
  const groupRef = useRef<SVGGElement>(null);
  const sliderRef = useRef<SVGGElement>(null);
  const titleId = useId();
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const x = model.x;
  const y = model.y;
  const sector = arcPoints(model.radians, ARC_RADIUS);
  const showTriangle = Math.abs(x) > 0.04 && Math.abs(y) > 0.04;
  const marker = 0.09;
  const showMarker = showTriangle && Math.abs(x) > marker * 2 && Math.abs(y) > marker * 2;
  const ax = Math.sign(x) || 1;
  const ay = Math.sign(y) || 1;
  const rightAngle = showMarker
    ? [
        { x: x - ax * marker, y: 0 },
        { x: x - ax * marker, y: ay * marker },
        { x, y: ay * marker },
      ]
    : [];
  const onAxisX = Math.abs(y) <= 0.04 && Math.abs(x) > 0.5;
  const onAxisY = Math.abs(x) <= 0.04 && Math.abs(y) > 0.5;
  const showCos = (showTriangle && Math.abs(x) > 0.28) || onAxisX;
  const showSin = (showTriangle && Math.abs(y) > 0.28) || onAxisY;
  const cosLabel = { x: x / 2, y: y >= 0 ? -0.18 : 0.18 };
  const sinLabel = { x: onAxisY ? 0.2 : x >= 0 ? x + 0.18 : x - 0.18, y: y / 2 };
  const showTheta = model.radians > 0.28 && model.radians < Math.PI * 2 - 0.28;
  const thetaAt = {
    x: Math.cos(model.radians / 2) * (ARC_RADIUS + 0.16),
    y: Math.sin(model.radians / 2) * (ARC_RADIUS + 0.16),
  };

  const move = (clientX: number, clientY: number) => {
    const group = groupRef.current;
    if (!group) return;
    const point = clientToMath(group, clientX, clientY);
    if (!point) return;
    onAngle(angleFromPoint(point.x, point.y));
  };

  const onPointerDown = (event: ReactPointerEvent<SVGGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    sliderRef.current?.focus();
    setDragging(true);
    move(event.clientX, event.clientY);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    move(event.clientX, event.clientY);
  };

  const onPointerUp = (event: ReactPointerEvent<SVGGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const onKeyDown = (event: ReactKeyboardEvent<SVGGElement>) => {
    if (event.key === "Home") {
      event.preventDefault();
      onAngle(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      onAngle(Math.PI);
      return;
    }
    let direction: -1 | 1 | 0 = 0;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") direction = 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") direction = -1;
    if (!direction) return;
    event.preventDefault();
    onStep(direction, event.shiftKey);
  };

  return (
    <svg
      viewBox="-1.9 -1.9 3.8 3.8"
      className="h-auto w-full touch-none select-none"
      role="group"
      aria-labelledby={titleId}
      data-dragging={dragging ? "true" : "false"}
    >
      <title id={titleId}>Unit circle with a draggable point</title>
      <g
        ref={groupRef}
        transform="scale(1,-1)"
        className={dragging ? "cursor-grabbing" : "cursor-grab"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <circle r={1.28} fill="transparent" />
        {sector.length > 1 ? (
          <polygon points={pointList([{ x: 0, y: 0 }, ...sector])} fill="var(--secondary-soft)" pointerEvents="none" />
        ) : null}
        <line
          x1={-1.22}
          y1={0}
          x2={1.22}
          y2={0}
          stroke="var(--line)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <line
          x1={0}
          y1={-1.22}
          x2={0}
          y2={1.22}
          stroke="var(--line)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <circle
          r={1}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <g pointerEvents="none" aria-hidden="true">
          {COMMON_ANGLES.map((angle) => {
            const theta = radiansOf(angle);
            const cardinal = angle.degrees % 90 === 0;
            const inner = cardinal ? 0.9 : 0.94;
            const outer = cardinal ? 1.08 : snap ? 1.05 : 1.03;
            return (
              <line
                key={angle.id}
                x1={Math.cos(theta) * inner}
                y1={Math.sin(theta) * inner}
                x2={Math.cos(theta) * outer}
                y2={Math.sin(theta) * outer}
                stroke={cardinal ? "var(--ink)" : "var(--ink-muted)"}
                strokeWidth={cardinal ? 2 : 1.5}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </g>
        {showTriangle ? (
          <polygon points={pointList([{ x: 0, y: 0 }, { x, y: 0 }, { x, y }])} fill="var(--surface)" pointerEvents="none" />
        ) : null}
        <line
          x1={0}
          y1={0}
          x2={x}
          y2={y}
          stroke="var(--ink)"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        {showTriangle ? (
          <line
            x1={0}
            y1={0}
            x2={x}
            y2={0}
            stroke="var(--secondary)"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        ) : null}
        {showTriangle ? (
          <line
            x1={x}
            y1={0}
            x2={x}
            y2={y}
            stroke="var(--ink)"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        ) : null}
        {sector.length > 1 ? (
          <polyline
            points={pointList(sector)}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        ) : null}
        {showMarker ? (
          <polyline
            points={pointList(rightAngle)}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        ) : null}
        <circle r={0.02} fill="var(--ink)" pointerEvents="none" />
        <g
          ref={sliderRef}
          role="slider"
          tabIndex={0}
          aria-label="Point on the unit circle"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(model.degrees)}
          aria-valuetext={model.announcement}
          aria-describedby={hintId}
          className="group cursor-grab outline-none focus-visible:outline-none"
          onKeyDown={onKeyDown}
        >
          <circle cx={x} cy={y} r={0.38} fill="transparent" />
          <circle
            cx={x}
            cy={y}
            r={THUMB_RADIUS}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={0.05}
            className="pointer-events-none group-focus-visible:stroke-secondary"
          />
          <circle cx={x} cy={y} r={0.055} fill="var(--secondary)" className="pointer-events-none" />
        </g>
      </g>
      <g pointerEvents="none" aria-hidden="true">
        {COMMON_ANGLES.filter((angle) => angle.degrees % 90 === 0).map((angle) => {
          const theta = radiansOf(angle);
          if (circularDistance(model.radians, theta) < 0.42) return null;
          const label = unit === "degrees" ? `${angle.degrees}°` : radianLabel(angle);
          return (
            <DiagramText
              key={angle.id}
              x={Math.cos(theta) * LABEL_RADIUS}
              y={-Math.sin(theta) * LABEL_RADIUS}
              fill="var(--ink-muted)"
            >
              {label}
            </DiagramText>
          );
        })}
        {showTheta ? (
          <DiagramText x={thetaAt.x} y={-thetaAt.y} fill="var(--secondary)" size={0.12}>
            θ
          </DiagramText>
        ) : null}
        {showCos ? (
          <DiagramText x={cosLabel.x} y={-cosLabel.y} fill="var(--secondary)">
            cos
          </DiagramText>
        ) : null}
        {showSin ? (
          <DiagramText x={sinLabel.x} y={-sinLabel.y} fill="var(--ink)">
            sin
          </DiagramText>
        ) : null}
      </g>
      <desc id={hintId}>
        Drag the thumb or the inside of the circle. Arrows move the point. Home returns to 0 degrees. End jumps to 180
        degrees.
      </desc>
    </svg>
  );
}

const RATIO_LABEL: Record<RatioId, string> = {
  sin: "sin θ",
  cos: "cos θ",
  tan: "tan θ",
  csc: "csc θ",
  sec: "sec θ",
  cot: "cot θ",
};

export function UnitCircle() {
  const [radians, setRadians] = useState(START_RADIANS);
  const [snap, setSnap] = useState(true);
  const [unit, setUnit] = useState<PrimaryUnit>("degrees");
  const [showTurns, setShowTurns] = useState(true);
  const [showSix, setShowSix] = useState(false);

  const applyAngle = useCallback(
    (next: number) => {
      setRadians(snap ? snapToCommon(next) : next);
    },
    [snap],
  );

  const step = useCallback(
    (direction: -1 | 1, coarse: boolean) => {
      setRadians((current) => {
        if (snap) return stepCommon(current, direction);
        return nudgeDegrees(current, direction * (coarse ? 15 : 1));
      });
    },
    [snap],
  );

  const toggleSnap = () => {
    const next = !snap;
    setSnap(next);
    if (next) setRadians((current) => snapToCommon(current));
  };

  const reset = useCallback(() => {
    setRadians(START_RADIANS);
    setSnap(true);
  }, []);

  return (
    <div data-tool="unit-circle">
      <MathLabFrame
        label="Unit circle lab"
        toolbar={
          <>
            <div role="group" aria-label="Primary angle unit" className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pillClass(unit === "degrees")}
                aria-pressed={unit === "degrees"}
                onClick={() => setUnit("degrees")}
              >
                Degrees
              </button>
              <button
                type="button"
                className={pillClass(unit === "radians")}
                aria-pressed={unit === "radians"}
                onClick={() => setUnit("radians")}
              >
                Radians
              </button>
            </div>
            <button type="button" className={pillClass(snap)} aria-pressed={snap} onClick={toggleSnap}>
              Snap
            </button>
            <button
              type="button"
              className={pillClass(showTurns)}
              aria-pressed={showTurns}
              onClick={() => setShowTurns((value) => !value)}
            >
              Turns
            </button>
            <button
              type="button"
              className={pillClass(showSix)}
              aria-pressed={showSix}
              onClick={() => setShowSix((value) => !value)}
            >
              All six
            </button>
            <button type="button" className="snap-btn-secondary" onClick={reset}>
              Reset
            </button>
          </>
        }
      >
        <UnitCircleStage
          radians={radians}
          snap={snap}
          unit={unit}
          showTurns={showTurns}
          showSix={showSix}
          onAngle={applyAngle}
          onStep={step}
          onPreset={(angle) => setRadians(radiansOf(angle))}
          onReset={reset}
        />
      </MathLabFrame>
    </div>
  );
}

function UnitCircleStage({
  radians,
  snap,
  unit,
  showTurns,
  showSix,
  onAngle,
  onStep,
  onPreset,
  onReset,
}: {
  radians: number;
  snap: boolean;
  unit: PrimaryUnit;
  showTurns: boolean;
  showSix: boolean;
  onAngle: (radians: number) => void;
  onStep: (direction: -1 | 1, coarse: boolean) => void;
  onPreset: (angle: CommonAngle) => void;
  onReset: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const model = circleModel(radians, showTurns);
  const primary = unit === "degrees" ? model.degreeText : model.radianText;
  const secondary = unit === "degrees" ? model.radianText : model.degreeText;
  const commonId = model.common?.id ?? "";
  const [seen, setSeen] = useState(commonId);
  const [popKey, setPopKey] = useState(0);
  if (seen !== commonId) {
    setSeen(commonId);
    if (commonId) setPopKey((value) => value + 1);
  }

  const reset = useCallback(() => {
    onReset();
  }, [onReset]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select")) return;
      if (projector) {
        exit();
        return;
      }
      reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, projector, reset]);

  return (
    <div
      className="no-print"
      data-degrees={model.common ? String(model.common.degrees) : model.degrees.toFixed(2)}
      data-radians={model.radianText}
      data-cos={model.ratios.cos.text}
      data-sin={model.ratios.sin.text}
      data-turn={model.turnText}
      data-quadrant={model.quadrant}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
        <div className="min-w-0 lg:order-1">
          <p className="max-w-3xl text-base leading-relaxed text-ink sm:text-lg">
            Drag the point around the circle. The horizontal side is cosine. The vertical side is sine.
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-4">
            <Stat label={unit === "degrees" ? "Degrees" : "Radians"} value={primary} large={projector} name="primary" tone="primary" />
            <Stat label={unit === "degrees" ? "Radians" : "Degrees"} value={secondary} large={false} name="secondary" tone="primary" />
          </div>
          {showTurns ? (
            <p className="mt-4 font-display text-3xl tabular-nums leading-none text-ink sm:text-4xl" data-stat="turn">
              {model.turnText}
            </p>
          ) : null}
          <div
            key={popKey}
            className={`mt-6 flex flex-wrap items-end gap-x-10 gap-y-4 ${popKey > 0 ? "animate-pop motion-reduce:animate-none" : ""}`}
          >
            <Stat label="cos θ" value={model.ratios.cos.text} large={projector} name="cos" tone="cos" />
            <Stat label="sin θ" value={model.ratios.sin.text} large={projector} name="sin" tone="sin" />
          </div>
          <p className="mt-3 font-display text-2xl tabular-nums text-ink sm:text-3xl" data-point>
            ({model.ratios.cos.text}, {model.ratios.sin.text})
          </p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted">{model.quadrant}</p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink sm:text-lg" aria-live="polite" aria-atomic="true">
            {model.caption}
          </p>

          <div role="group" aria-label="Common angles" className="mt-4 flex flex-wrap gap-2">
            {COMMON_ANGLES.map((angle) => {
              const active = model.common?.id === angle.id;
              const label = unit === "degrees" ? `${angle.degrees}°` : radianLabel(angle);
              return (
                <button
                  key={angle.id}
                  type="button"
                  className={pillClass(active)}
                  aria-pressed={active}
                  onClick={() => onPreset(angle)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {showSix ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" data-ratios="six">
              {RATIO_IDS.map((id) => {
                const ratio = model.ratios[id];
                return (
                  <div key={id} className="rounded-2xl border border-line bg-surface px-4 py-3" data-ratio={id}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{RATIO_LABEL[id]}</p>
                    <p
                      className={`mt-1 font-display tabular-nums leading-none ${
                        ratio.defined ? "text-3xl text-ink sm:text-4xl" : "text-xl text-ink-muted sm:text-2xl"
                      }`}
                    >
                      {ratio.text}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}

          <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-muted" aria-hidden="true">
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-7 border border-secondary bg-secondary-soft" />
              Adjacent, cosine
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-7 border-2 border-ink bg-surface" />
              Opposite, sine
            </span>
          </p>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            Snap catches 0°, 30°, 45°, 60°, 90°, and the rest of that family — the same places as π/6, π/4, π/3, and
            π/2. Arrows move one degree, or the next common angle when Snap is on. Shift plus an arrow moves 15°.
            Escape clears.
          </p>
        </div>
        <div className="snap-panel order-first lg:sticky lg:top-4 lg:order-2">
          <CircleFigure model={model} snap={snap} unit={unit} onAngle={onAngle} onStep={onStep} />
        </div>
      </div>
    </div>
  );
}
