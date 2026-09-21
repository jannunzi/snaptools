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
import Link from "next/link";
import { MathLabFrame, useMathLabProjector } from "@/components/labs/MathLabFrame";
import {
  AXIS_TICKS,
  CIRCLE_HIT,
  CIRCLE_VIEW,
  JOINED_ORIGIN,
  JOINED_VIEW,
  SPEEDS,
  STACKED_ORIGIN,
  START_RADIANS,
  WAVE_VIEW,
  WAVE_WIDTH,
  pickAngle,
  pickDragAngle,
  radiansPerSecond,
  seriesPolyline,
  waveOffset,
  waveReadout,
  type FigureMode,
  type SpeedId,
  type WaveReadout,
} from "@/lib/sine-from-circle";
import {
  TAU,
  arcPoints,
  circularDistance,
  nudgeDegrees,
  normalizeRadians,
  pointList,
  pointOnCircle,
  type PrimaryUnit,
} from "@/lib/unit-circle";

const THUMB_RADIUS = 0.2;

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
  size = 0.2,
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
}: {
  label: string;
  value: string;
  large: boolean;
  name: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p
        data-stat={name}
        className={`font-display tabular-nums leading-none text-ink ${large ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function axisName(unit: PrimaryUnit) {
  return unit === "degrees" ? "Degrees" : "Radians";
}

function SineFigure({
  mode,
  readout,
  hover,
  showCosine,
  unit,
  onScrub,
  onHover,
  onStep,
  onTogglePlay,
}: {
  mode: FigureMode;
  readout: WaveReadout;
  hover: number | null;
  showCosine: boolean;
  unit: PrimaryUnit;
  onScrub: (radians: number) => void;
  onHover: (radians: number | null) => void;
  onStep: (direction: -1 | 1, coarse: boolean) => void;
  onTogglePlay: () => void;
}) {
  const mathRef = useRef<SVGGElement>(null);
  const sliderRef = useRef<SVGGElement>(null);
  const titleId = useId();
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const originX = mode === "joined" ? JOINED_ORIGIN : STACKED_ORIGIN;
  const viewBox = mode === "joined" ? JOINED_VIEW : mode === "circle" ? CIRCLE_VIEW : WAVE_VIEW;
  const showCircle = mode !== "wave";
  const showWave = mode !== "circle";
  const theta = readout.radians;
  const x = readout.x;
  const y = readout.y;
  const waveX = originX + waveOffset(theta);
  const sector = arcPoints(theta, 0.36);
  const showTheta = theta > 0.35 && theta < TAU - 0.35;
  const thetaAt = {
    x: Math.cos(theta / 2) * 0.56,
    y: Math.sin(theta / 2) * 0.56,
  };
  const showSinLabel = Math.abs(y) > 0.38;
  const sinLabel = {
    x: Math.abs(x) < 0.28 ? 0.32 : x > 0 ? Math.min(x + 0.28, 1.35) : Math.max(x - 0.28, -1.35),
    y: y / 2,
  };
  const showCosLabel = showCosine && Math.abs(x) > 0.38;
  const cosLabel = { x: x / 2, y: y >= 0 ? -0.24 : 0.24 };
  const hoverPoint = hover === null ? null : pointOnCircle(hover);
  const showHover = hoverPoint !== null && hover !== null && circularDistance(hover, theta) > 0.07;
  const hoverWaveX = showHover && hover !== null ? originX + waveOffset(hover) : 0;
  const sineTrace = seriesPolyline(Math.sin, theta, originX);
  const cosineTrace = seriesPolyline(Math.cos, theta, originX);
  const sineFull = seriesPolyline(Math.sin, TAU, originX);
  const cosineFull = seriesPolyline(Math.cos, TAU, originX);

  const pointFromEvent = (event: ReactPointerEvent<SVGGElement>) => {
    const group = mathRef.current;
    if (!group) return null;
    return clientToMath(group, event.clientX, event.clientY);
  };

  const onPointerDown = (event: ReactPointerEvent<SVGGElement>) => {
    const point = pointFromEvent(event);
    if (!point) return;
    const angle = pickAngle(point.x, point.y, mode, originX);
    if (angle === null) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    sliderRef.current?.focus();
    setDragging(true);
    onScrub(angle);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    const point = pointFromEvent(event);
    if (!point) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      onScrub(pickDragAngle(point.x, point.y, mode, originX));
      return;
    }
    onHover(pickAngle(point.x, point.y, mode, originX));
  };

  const onPointerUp = (event: ReactPointerEvent<SVGGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const onPointerLeave = () => {
    if (dragging) return;
    onHover(null);
  };

  const onKeyDown = (event: ReactKeyboardEvent<SVGGElement>) => {
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      onTogglePlay();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      onScrub(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      onScrub(Math.PI);
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
      viewBox={viewBox}
      className={`h-auto w-full touch-none select-none ${mode === "circle" ? "mx-auto max-w-xl" : ""}`}
      role="group"
      aria-labelledby={titleId}
      data-layout={mode}
      data-dragging={dragging ? "true" : "false"}
    >
      <title id={titleId}>
        {mode === "wave"
          ? "Sine wave traced from the angle"
          : mode === "circle"
            ? "Unit circle with a rotating radius"
            : "Unit circle unwrapping into a sine wave"}
      </title>
      <g
        ref={mathRef}
        transform="scale(1,-1)"
        className={dragging ? "cursor-grabbing" : "cursor-grab"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        {showCircle ? <circle r={CIRCLE_HIT} fill="transparent" /> : null}
        {showWave ? (
          <rect
            x={originX - 0.25}
            y={-1.45}
            width={WAVE_WIDTH + 0.5}
            height={2.9}
            fill="transparent"
          />
        ) : null}

        {showCircle ? (
          <g pointerEvents="none">
            {sector.length > 1 ? (
              <polygon points={pointList([{ x: 0, y: 0 }, ...sector])} fill="var(--secondary-soft)" />
            ) : null}
            <line x1={-1.18} y1={0} x2={1.18} y2={0} stroke="var(--line)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={-1.18} x2={0} y2={1.18} stroke="var(--line)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <circle r={1} fill="none" stroke="var(--ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            {sector.length > 1 ? (
              <polyline
                points={pointList(sector)}
                fill="none"
                stroke="var(--secondary)"
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
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
            />
            {showCosine ? (
              <line
                x1={0}
                y1={0}
                x2={x}
                y2={0}
                stroke="var(--secondary)"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <line
              x1={x}
              y1={0}
              x2={x}
              y2={y}
              stroke="var(--ink)"
              strokeWidth={3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {showHover && hoverPoint ? (
              <g>
                <line
                  x1={0}
                  y1={0}
                  x2={hoverPoint.x}
                  y2={hoverPoint.y}
                  stroke="var(--secondary)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={hoverPoint.x}
                  cy={hoverPoint.y}
                  r={0.09}
                  fill="none"
                  stroke="var(--secondary)"
                  strokeWidth={2.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ) : null}
          </g>
        ) : null}

        {showWave ? (
          <g pointerEvents="none">
            <line
              x1={originX}
              y1={1}
              x2={originX + WAVE_WIDTH}
              y2={1}
              stroke="var(--line)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={originX}
              y1={-1}
              x2={originX + WAVE_WIDTH}
              y2={-1}
              stroke="var(--line)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            {AXIS_TICKS.map((tick) => (
              <line
                key={tick.radians}
                x1={originX + waveOffset(tick.theta)}
                y1={-1.08}
                x2={originX + waveOffset(tick.theta)}
                y2={1.08}
                stroke="var(--line)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <line
              x1={originX}
              y1={0}
              x2={originX + WAVE_WIDTH}
              y2={0}
              stroke="var(--ink-muted)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={originX}
              y1={-1.15}
              x2={originX}
              y2={1.15}
              stroke="var(--ink)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={sineFull}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.16}
              vectorEffect="non-scaling-stroke"
            />
            {showCosine ? (
              <polyline
                points={cosineFull}
                fill="none"
                stroke="var(--secondary)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.28}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {showCosine ? (
              <polyline
                points={cosineTrace}
                fill="none"
                stroke="var(--secondary)"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <polyline
              points={sineTrace}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={waveX}
              y1={0}
              x2={waveX}
              y2={y}
              stroke="var(--ink)"
              strokeWidth={3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {showHover && hover !== null ? (
              <g>
                <line
                  x1={hoverWaveX}
                  y1={-1.12}
                  x2={hoverWaveX}
                  y2={1.12}
                  stroke="var(--secondary)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={hoverWaveX}
                  cy={Math.sin(hover)}
                  r={0.09}
                  fill="none"
                  stroke="var(--secondary)"
                  strokeWidth={2.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ) : null}
          </g>
        ) : null}

        {mode === "joined" ? (
          <g pointerEvents="none">
            <line
              x1={x}
              y1={y}
              x2={waveX}
              y2={y}
              stroke="var(--ink)"
              strokeWidth={1.5}
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
            />
            {showHover && hoverPoint && hover !== null ? (
              <line
                x1={hoverPoint.x}
                y1={hoverPoint.y}
                x2={hoverWaveX}
                y2={hoverPoint.y}
                stroke="var(--secondary)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </g>
        ) : null}

        <g
          ref={sliderRef}
          role="slider"
          tabIndex={0}
          aria-label={mode === "wave" ? "Angle on the sine wave" : "Angle on the unit circle"}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(readout.degrees)}
          aria-valuetext={readout.announcement}
          aria-describedby={hintId}
          className="group cursor-grab outline-none focus-visible:outline-none"
          onKeyDown={onKeyDown}
        >
          {showCircle ? (
            <g pointerEvents="none">
              <circle cx={x} cy={y} r={0.34} fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={THUMB_RADIUS}
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth={0.045}
                className="group-focus-visible:stroke-secondary"
              />
              <circle cx={x} cy={y} r={0.055} fill="var(--secondary)" />
            </g>
          ) : null}
          {showWave ? (
            <g pointerEvents="none">
              {showCosine ? (
                <circle
                  cx={waveX}
                  cy={readout.x}
                  r={0.11}
                  fill="var(--secondary)"
                  stroke="var(--surface)"
                  strokeWidth={0.035}
                />
              ) : null}
              <circle
                cx={waveX}
                cy={y}
                r={THUMB_RADIUS}
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth={0.045}
                className="group-focus-visible:stroke-secondary"
              />
              <circle cx={waveX} cy={y} r={0.055} fill="var(--secondary)" />
            </g>
          ) : null}
        </g>
      </g>

      <g pointerEvents="none" aria-hidden="true">
        {showWave
          ? AXIS_TICKS.map((tick) => (
              <DiagramText
                key={tick.radians}
                x={originX + waveOffset(tick.theta)}
                y={1.42}
                fill="var(--ink-muted)"
                size={0.18}
              >
                {unit === "degrees" ? tick.degrees : tick.radians}
              </DiagramText>
            ))
          : null}
        {showWave ? (
          <g>
            <DiagramText x={originX - 0.18} y={-1} fill="var(--ink-muted)" size={0.18} anchor="end">
              1
            </DiagramText>
            <DiagramText x={originX - 0.18} y={0} fill="var(--ink-muted)" size={0.18} anchor="end">
              0
            </DiagramText>
            <DiagramText x={originX - 0.18} y={1} fill="var(--ink-muted)" size={0.18} anchor="end">
              −1
            </DiagramText>
          </g>
        ) : null}
        {showCircle && showTheta ? (
          <DiagramText x={thetaAt.x} y={-thetaAt.y} fill="var(--secondary)" size={0.2}>
            θ
          </DiagramText>
        ) : null}
        {showCircle && showSinLabel ? (
          <DiagramText x={sinLabel.x} y={-sinLabel.y} fill="var(--ink)" size={0.18}>
            sin
          </DiagramText>
        ) : null}
        {showCircle && showCosLabel ? (
          <DiagramText x={cosLabel.x} y={-cosLabel.y} fill="var(--secondary)" size={0.18}>
            cos
          </DiagramText>
        ) : null}
      </g>
      <desc id={hintId}>
        Drag the circle or the wave. Arrow keys move one degree. Shift plus an arrow moves 15 degrees. Home returns to
        0 degrees. End jumps to 180 degrees. Space plays and pauses.
      </desc>
    </svg>
  );
}

export function SineFromCircle() {
  const [radians, setRadians] = useState(START_RADIANS);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<SpeedId>("medium");
  const [showCosine, setShowCosine] = useState(false);
  const [unit, setUnit] = useState<PrimaryUnit>("degrees");
  const radiansRef = useRef(radians);
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);

  useEffect(() => {
    radiansRef.current = radians;
    playingRef.current = playing;
    speedRef.current = speed;
  }, [playing, radians, speed]);

  const setAngle = useCallback((next: number) => {
    const wrapped = normalizeRadians(next);
    radiansRef.current = wrapped;
    setRadians(wrapped);
  }, []);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const scrub = useCallback(
    (next: number) => {
      pause();
      setAngle(next);
    },
    [pause, setAngle],
  );

  const step = useCallback(
    (direction: -1 | 1, coarse: boolean) => {
      pause();
      setAngle(nudgeDegrees(radiansRef.current, direction * (coarse ? 15 : 1)));
    },
    [pause, setAngle],
  );

  const togglePlay = useCallback(() => {
    setPlaying((value) => !value);
  }, []);

  const reset = useCallback(() => {
    pause();
    setAngle(START_RADIANS);
  }, [pause, setAngle]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (!playingRef.current) return;
      if (document.hidden) {
        last = now;
        frame = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const next = normalizeRadians(radiansRef.current + radiansPerSecond(speedRef.current) * dt);
      radiansRef.current = next;
      setRadians(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  return (
    <div data-tool="sine-from-circle">
      <MathLabFrame
        label="Sine from circle lab"
        toolbar={
          <>
            <button
              type="button"
              className="snap-btn shrink-0"
              aria-pressed={playing}
              onClick={togglePlay}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <div role="group" aria-label="Animation speed" className="flex flex-wrap gap-2">
              {SPEEDS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={pillClass(speed === preset.id)}
                  aria-pressed={speed === preset.id}
                  onClick={() => {
                    speedRef.current = preset.id;
                    setSpeed(preset.id);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Angle unit" className="flex flex-wrap gap-2">
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
            <button
              type="button"
              className={pillClass(showCosine)}
              aria-pressed={showCosine}
              onClick={() => setShowCosine((value) => !value)}
            >
              Cosine
            </button>
            <button type="button" className="snap-btn-secondary" onClick={reset}>
              Reset
            </button>
          </>
        }
      >
        <SineStage
          radians={radians}
          playing={playing}
          speed={speed}
          showCosine={showCosine}
          unit={unit}
          onScrub={scrub}
          onStep={step}
          onTogglePlay={togglePlay}
          onReset={reset}
        />
      </MathLabFrame>
    </div>
  );
}

function SineStage({
  radians,
  playing,
  speed,
  showCosine,
  unit,
  onScrub,
  onStep,
  onTogglePlay,
  onReset,
}: {
  radians: number;
  playing: boolean;
  speed: SpeedId;
  showCosine: boolean;
  unit: PrimaryUnit;
  onScrub: (radians: number) => void;
  onStep: (direction: -1 | 1, coarse: boolean) => void;
  onTogglePlay: () => void;
  onReset: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const readout = waveReadout(radians, showCosine);
  const [hover, setHover] = useState<number | null>(null);
  const [live, setLive] = useState({ caption: readout.caption, announcement: readout.announcement });
  const bucketRef = useRef<number | null>(null);
  const primary = unit === "degrees" ? readout.degreeText : readout.radianText;
  const secondary = unit === "degrees" ? readout.radianText : readout.degreeText;

  useEffect(() => {
    const bucket = Math.round((readout.radians * 180) / Math.PI / 15);
    if (playing) {
      if (bucketRef.current === bucket) return;
      bucketRef.current = bucket;
      setLive({ caption: readout.caption, announcement: readout.announcement });
      return;
    }
    const id = window.setTimeout(() => {
      bucketRef.current = bucket;
      setLive({ caption: readout.caption, announcement: readout.announcement });
    }, 160);
    return () => window.clearTimeout(id);
  }, [playing, readout.announcement, readout.caption, readout.radians]);

  const reset = useCallback(() => {
    setHover(null);
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

  const figureProps = {
    readout,
    hover,
    showCosine,
    unit,
    onScrub: (next: number) => {
      setHover(null);
      onScrub(next);
    },
    onHover: setHover,
    onStep,
    onTogglePlay,
  };

  return (
    <div
      className="no-print"
      data-degrees={readout.degrees.toFixed(2)}
      data-radians={readout.radianText}
      data-sin={readout.sinText}
      data-cos={readout.cosText}
      data-playing={playing ? "true" : "false"}
      data-cosine={showCosine ? "true" : "false"}
      data-speed={speed}
      data-hover={hover === null ? "" : ((hover * 180) / Math.PI).toFixed(1)}
    >
      <p className="max-w-3xl text-base leading-relaxed text-ink sm:text-lg">
        Play, or drag the point. The height on the circle is the height on the wave.
      </p>
      <div className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-4">
        <Stat label={axisName(unit)} value={primary} large={projector} name="primary" />
        <Stat
          label={unit === "degrees" ? "Radians" : "Degrees"}
          value={secondary}
          large={false}
          name="secondary"
        />
        <Stat label="sin θ" value={readout.sinText} large={projector} name="sin" />
        {showCosine ? <Stat label="cos θ" value={readout.cosText} large={projector} name="cos" /> : null}
      </div>

      <div className="snap-panel mt-5">
        <div className="hidden lg:block">
          <SineFigure mode="joined" {...figureProps} />
        </div>
        <div className="grid gap-6 lg:hidden">
          <SineFigure mode="circle" {...figureProps} />
          <SineFigure mode="wave" {...figureProps} />
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink sm:text-lg" aria-hidden="true">
        {live.caption}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {live.announcement}
      </p>

      <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted" aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-7 bg-ink" />
          Sine, the height
        </span>
        {showCosine ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-7 bg-secondary" />
            Cosine, the horizontal coordinate
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2">
          <span className="h-px w-7 border-t border-dashed border-ink" />
          Same height
        </span>
      </p>
      <p className="mt-2 max-w-3xl text-sm text-ink-muted">
        Drag the circle or the wave. Arrows move one degree. Shift plus an arrow moves 15°. Space plays and pauses
        while the picture is focused. Escape clears. The right triangle for one angle is in the{" "}
        <Link href="/tools/unit-circle" className="snap-link">
          Unit Circle Lab
        </Link>
        .
      </p>
    </div>
  );
}
