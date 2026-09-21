/**
 * Sine-from-circle lab.
 * One turn of the unit circle (0 to 2π) maps onto a wave of the same
 * vertical scale, so the point's height is the sine graph's height.
 */

import { TAU, circleModel, normalizeRadians } from "@/lib/unit-circle";

export const START_RADIANS = 0;
export const WAVE_WIDTH = 6.45;
export const JOINED_ORIGIN = 2.05;
export const STACKED_ORIGIN = 0;
export const CIRCLE_HIT = 1.34;
export const JOINED_VIEW = "-1.62 -1.8 10.75 3.6";
export const CIRCLE_VIEW = "-1.7 -1.7 3.4 3.4";
export const WAVE_VIEW = "-1.05 -1.8 8.15 3.6";

export const SPEEDS = [
  { id: "slow", label: "Slow", secondsPerTurn: 12 },
  { id: "medium", label: "Medium", secondsPerTurn: 6 },
  { id: "fast", label: "Fast", secondsPerTurn: 3 },
] as const;

export type SpeedId = (typeof SPEEDS)[number]["id"];
export type FigureMode = "joined" | "circle" | "wave";

export const AXIS_TICKS = [
  { theta: 0, degrees: "0°", radians: "0" },
  { theta: Math.PI / 2, degrees: "90°", radians: "π/2" },
  { theta: Math.PI, degrees: "180°", radians: "π" },
  { theta: (3 * Math.PI) / 2, degrees: "270°", radians: "3π/2" },
  { theta: TAU, degrees: "360°", radians: "2π" },
] as const;

export function radiansPerSecond(speed: SpeedId) {
  const preset = SPEEDS.find((item) => item.id === speed) ?? SPEEDS[1];
  return TAU / preset.secondsPerTurn;
}

export function waveOffset(theta: number) {
  return (theta / TAU) * WAVE_WIDTH;
}

/** Angle for a horizontal position on the wave, in [0, 2π). The right edge stays just shy of a full turn so the trace does not wrap back to the start. */
export function angleFromWaveLocalX(localX: number) {
  const clamped = Math.min(WAVE_WIDTH, Math.max(0, localX));
  if (clamped >= WAVE_WIDTH - 1e-3) return TAU - 1e-4;
  return (clamped / WAVE_WIDTH) * TAU;
}

function circleAngle(x: number, y: number) {
  if (x === 0 && y === 0) return 0;
  return normalizeRadians(Math.atan2(y, x));
}

export function pickAngle(x: number, y: number, mode: FigureMode, originX: number) {
  if (mode !== "wave" && Math.hypot(x, y) <= CIRCLE_HIT) return circleAngle(x, y);
  if (mode === "circle") return null;
  const localX = x - originX;
  if (localX >= -0.25 && localX <= WAVE_WIDTH + 0.25 && y >= -1.45 && y <= 1.45) {
    return angleFromWaveLocalX(localX);
  }
  return null;
}

/** Keep a drag alive when the pointer slips outside the circle or the wave. */
export function pickDragAngle(x: number, y: number, mode: FigureMode, originX: number) {
  if (mode === "circle") return circleAngle(x, y);
  if (mode === "wave") return angleFromWaveLocalX(x - originX);
  if (x < originX - 0.35) return circleAngle(x, y);
  return angleFromWaveLocalX(x - originX);
}

export function seriesPolyline(
  read: (theta: number) => number,
  endTheta: number,
  originX: number,
) {
  const end = Math.min(TAU, Math.max(0, endTheta));
  const count = end < 1e-4 ? 0 : Math.max(12, Math.round(360 * (end / TAU)));
  const parts: string[] = [];
  for (let index = 0; index <= count; index += 1) {
    const theta = count === 0 ? 0 : (end * index) / count;
    const x = originX + waveOffset(theta);
    const y = read(theta);
    parts.push(`${x.toFixed(3)},${y.toFixed(3)}`);
  }
  return parts.join(" ");
}

export type WaveReadout = {
  radians: number;
  degrees: number;
  degreeText: string;
  radianText: string;
  sinText: string;
  cosText: string;
  x: number;
  y: number;
  caption: string;
  announcement: string;
};

export function waveReadout(radians: number, showCosine: boolean): WaveReadout {
  const model = circleModel(radians, false);
  const nearFull = model.radians > TAU - 1e-3;
  const degreeText = nearFull ? "360°" : model.degreeText;
  const radianText = nearFull ? "2π" : model.radianText;
  const sinText = model.ratios.sin.text;
  const cosText = model.ratios.cos.text;
  const caption = showCosine
    ? `${degreeText}, ${radianText} radians. sin θ = ${sinText}. cos θ = ${cosText}.`
    : `${degreeText}, ${radianText} radians. sin θ = ${sinText}.`;
  const degreesSpoken = nearFull ? "360 degrees" : model.degreeText.replace("°", " degrees");
  const radiansSpoken = nearFull ? "2 pi radians" : model.radianSpoken;
  const announcement = showCosine
    ? `${degreesSpoken}, ${radiansSpoken}. Sine ${model.ratios.sin.spoken}. Cosine ${model.ratios.cos.spoken}.`
    : `${degreesSpoken}, ${radiansSpoken}. Sine ${model.ratios.sin.spoken}.`;

  return {
    radians: model.radians,
    degrees: nearFull ? 360 : model.degrees,
    degreeText,
    radianText,
    sinText,
    cosText,
    x: model.x,
    y: model.y,
    caption,
    announcement,
  };
}
