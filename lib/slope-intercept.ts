/**
 * Slope–intercept lab: y = mx + b on a square coordinate plane.
 * The intercept stays on the y-axis. The other point moves anywhere on the
 * grid, including left of the intercept and below it. Snap lands on whole
 * numbers. The same x is a vertical line, x = 0, with undefined slope.
 */

export const PLANE = 8;
export const M_MIN = -16;
export const M_MAX = 16;
export const B_MIN = -PLANE;
export const B_MAX = PLANE;
export const START_M = 2;
export const START_B = 1;
export const COMPARE_M = -1;
export const COMPARE_B = 3;

const MINUS = "−";
const FRACTION_EPSILON = 0.0015;

export type LabMode = "explore" | "compare" | "match";

export type Rational = {
  num: number;
  den: number;
};

export type FormattedNumber = {
  text: string;
  absText: string;
  spoken: string;
  spokenAbs: string;
  negative: boolean;
  zero: boolean;
};

export type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type TriangleGeometry = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  rise: number;
  run: number;
  riseText: string;
  runText: string;
  showRise: boolean;
};

export type PlanePoint = {
  x: number;
  y: number;
};

export type LineReadout = {
  m: number | null;
  b: number;
  run: number;
  rise: number;
  vertical: boolean;
  point: PlanePoint;
  slopeText: string;
  interceptText: string;
  slopeSpoken: string;
  interceptSpoken: string;
  equation: string;
  equationSpoken: string;
  segment: Segment | null;
  triangle: TriangleGeometry | null;
  caption: string;
  announcement: string;
};

export type MatchTarget = {
  m: number;
  b: number;
};

const ZERO: FormattedNumber = {
  text: "0",
  absText: "0",
  spoken: "0",
  spokenAbs: "0",
  negative: false,
  zero: true,
};

function gcd(a: number, b: number) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function buildSlopeSnaps() {
  const values = new Set<number>();
  for (let den = 1; den <= 4; den += 1) {
    for (let num = -4 * den; num <= 4 * den; num += 1) {
      values.add(num / den);
    }
  }
  return [...values].sort((left, right) => left - right);
}

function buildInterceptSnaps() {
  const values: number[] = [];
  for (let tick = B_MIN; tick <= B_MAX; tick += 1) values.push(tick);
  return values;
}

export const SNAP_SLOPES: readonly number[] = buildSlopeSnaps();
export const SNAP_INTERCEPTS: readonly number[] = buildInterceptSnaps();

export const MATCH_TARGETS: readonly MatchTarget[] = [
  { m: 1, b: 0 },
  { m: 1 / 2, b: 2 },
  { m: -2, b: 1 },
  { m: 2 / 3, b: -1 },
  { m: 0, b: 4 },
  { m: -1 / 2, b: -2 },
  { m: 3, b: -3 },
  { m: -3 / 4, b: 3 },
].map((line) => ({ m: snapSlope(line.m), b: snapIntercept(line.b) }));

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function gridTicks(limit = PLANE) {
  const ticks: number[] = [];
  for (let tick = -limit; tick <= limit; tick += 1) ticks.push(tick);
  return ticks;
}

function nearest(value: number, options: readonly number[]) {
  let best = options[0] ?? 0;
  let bestDistance = Infinity;
  for (const option of options) {
    const distance = Math.abs(option - value);
    if (distance < bestDistance) {
      best = option;
      bestDistance = distance;
    }
  }
  return best;
}

export function snapSlope(value: number) {
  if (!Number.isFinite(value)) return 0;
  return nearest(clamp(value, M_MIN, M_MAX), SNAP_SLOPES);
}

export function snapIntercept(value: number) {
  if (!Number.isFinite(value)) return 0;
  return nearest(clamp(value, B_MIN, B_MAX), SNAP_INTERCEPTS);
}

export function stepSlope(value: number, direction: -1 | 1, snap: boolean) {
  if (!snap) return clamp(Math.round((value + direction * 0.1) * 10) / 10, M_MIN, M_MAX);
  const current = snapSlope(value);
  const index = SNAP_SLOPES.indexOf(current);
  const resolved = index === -1 ? SNAP_SLOPES.findIndex((item) => Math.abs(item - current) < 1e-9) : index;
  const next = SNAP_SLOPES[clamp(resolved + direction, 0, SNAP_SLOPES.length - 1)];
  return next ?? current;
}

export function stepIntercept(value: number, direction: -1 | 1, snap: boolean) {
  if (!snap) return clamp(Math.round((value + direction * 0.1) * 10) / 10, B_MIN, B_MAX);
  const current = snapIntercept(value);
  const index = SNAP_INTERCEPTS.findIndex((item) => Math.abs(item - current) < 1e-9);
  const next = SNAP_INTERCEPTS[clamp(index + direction, 0, SNAP_INTERCEPTS.length - 1)];
  return next ?? current;
}

function bestFraction(value: number, maxDen: number, epsilon: number): Rational | null {
  const abs = Math.abs(value);
  let bestNum = Math.round(abs);
  let bestDen = 1;
  let bestErr = Math.abs(abs - bestNum);
  for (let den = 1; den <= maxDen; den += 1) {
    const num = Math.round(abs * den);
    const err = Math.abs(abs - num / den);
    if (err < bestErr - 1e-12) {
      bestNum = num;
      bestDen = den;
      bestErr = err;
    }
  }
  if (bestErr > epsilon) return null;
  const divisor = gcd(bestNum, bestDen);
  const signed = value < 0 ? -1 : 1;
  return { num: signed * (bestNum / divisor), den: bestDen / divisor };
}

function fromRational(rational: Rational): FormattedNumber {
  const divisor = gcd(rational.num, rational.den);
  const num = rational.num / divisor;
  const den = Math.abs(rational.den / divisor);
  if (num === 0) return ZERO;
  const negative = num < 0;
  const absNum = Math.abs(num);
  const absText = den === 1 ? String(absNum) : `${absNum}/${den}`;
  const spokenAbs = den === 1 ? String(absNum) : `${absNum} over ${den}`;
  return {
    text: negative ? `${MINUS}${absText}` : absText,
    absText,
    spoken: negative ? `negative ${spokenAbs}` : spokenAbs,
    spokenAbs,
    negative,
    zero: false,
  };
}

function fromDecimal(value: number): FormattedNumber {
  const hundredths = Math.round(value * 100) / 100;
  const tenths = Math.round(hundredths * 10) / 10;
  const use = Math.abs(hundredths - tenths) < 0.001 ? tenths : hundredths;
  if (Math.abs(use) < 0.001) return ZERO;
  const places = Math.abs(use * 10 - Math.round(use * 10)) < 1e-6 ? 1 : 2;
  const absText = Math.abs(use).toFixed(places);
  const negative = use < 0;
  const spokenAbs = absText.replace(".", " point ");
  return {
    text: negative ? `${MINUS}${absText}` : absText,
    absText,
    spoken: negative ? `negative ${spokenAbs}` : spokenAbs,
    spokenAbs,
    negative,
    zero: false,
  };
}

export function formatValue(value: number): FormattedNumber {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-9) return ZERO;
  const rational = bestFraction(value, PLANE, FRACTION_EPSILON);
  if (rational) return fromRational(rational);
  return fromDecimal(value);
}

function mxPart(slope: FormattedNumber) {
  if (slope.zero) return "";
  if (slope.absText === "1") return slope.negative ? `${MINUS}x` : "x";
  const body = slope.absText.includes("/") ? `(${slope.absText})x` : `${slope.absText}x`;
  return slope.negative ? `${MINUS}${body}` : body;
}

function mxSpoken(slope: FormattedNumber) {
  if (slope.absText === "1") return slope.negative ? "negative x" : "x";
  return `${slope.spoken} x`;
}

export function equationOf(slope: FormattedNumber, intercept: FormattedNumber) {
  if (slope.zero && intercept.zero) return { text: "y = 0", spoken: "y equals 0" };
  if (slope.zero) return { text: `y = ${intercept.text}`, spoken: `y equals ${intercept.spoken}` };
  const mx = mxPart(slope);
  const mxVoice = mxSpoken(slope);
  if (intercept.zero) return { text: `y = ${mx}`, spoken: `y equals ${mxVoice}` };
  const sign = intercept.negative ? MINUS : "+";
  const join = intercept.negative ? "minus" : "plus";
  return {
    text: `y = ${mx} ${sign} ${intercept.absText}`,
    spoken: `y equals ${mxVoice} ${join} ${intercept.spokenAbs}`,
  };
}

export function preferredRun(m: number) {
  const fraction = bestFraction(m, 4, FRACTION_EPSILON);
  if (!fraction || fraction.den === 1) return Math.abs(m) <= 2 ? 2 : 1;
  return fraction.den;
}

export function initialPoint(m: number, b: number): PlanePoint {
  const x = preferredRun(m);
  return { x, y: clean(b + m * x) };
}

function clean(value: number) {
  const rounded = Math.round(value * 1000) / 1000;
  return rounded === 0 ? 0 : rounded;
}

function roundTo(value: number, step: number) {
  return clean(Math.round(value / step) * step);
}

function nearly(left: number, right: number) {
  return Math.abs(left - right) < 1e-9;
}

function gridStep(snap: boolean) {
  return snap ? 1 : 0.1;
}

function overlapsIntercept(point: PlanePoint, b: number) {
  return nearly(point.x, 0) && nearly(point.y, b);
}

export function clipLine(m: number, b: number, limit = PLANE): Segment | null {
  if (!Number.isFinite(m) || !Number.isFinite(b)) return null;
  const points: { x: number; y: number }[] = [];
  const push = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < -limit - 1e-6 || x > limit + 1e-6) return;
    if (y < -limit - 1e-6 || y > limit + 1e-6) return;
    if (points.some((point) => Math.abs(point.x - x) < 1e-6 && Math.abs(point.y - y) < 1e-6)) return;
    points.push({ x, y });
  };
  push(-limit, m * -limit + b);
  push(limit, m * limit + b);
  if (Math.abs(m) > 1e-9) {
    push((-limit - b) / m, -limit);
    push((limit - b) / m, limit);
  }
  if (points.length < 2) return null;
  let left = points[0];
  let right = points[1];
  let best = -1;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const distance = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (distance > best) {
        best = distance;
        left = points[i];
        right = points[j];
      }
    }
  }
  return { x1: left.x, y1: left.y, x2: right.x, y2: right.y };
}

export function clipVertical(x: number, limit = PLANE): Segment | null {
  if (!Number.isFinite(x) || x < -limit - 1e-6 || x > limit + 1e-6) return null;
  return { x1: x, y1: -limit, x2: x, y2: limit };
}

function triangleFor(b: number, point: PlanePoint): TriangleGeometry | null {
  if (Math.abs(point.x) < 0.45) return null;
  const rise = clean(point.y - b);
  const run = point.x;
  const limit = PLANE + 0.05;
  const inside = (x: number, y: number) => Math.abs(x) <= limit && Math.abs(y) <= limit;
  if (!inside(0, b) || !inside(run, b) || !inside(point.x, point.y)) return null;
  const riseFmt = formatValue(rise);
  const runFmt = formatValue(run);
  return {
    x1: 0,
    y1: b,
    x2: run,
    y2: b,
    x3: point.x,
    y3: point.y,
    rise,
    run,
    riseText: riseFmt.text,
    runText: runFmt.text,
    showRise: Math.abs(rise) >= 0.45,
  };
}

function climbSentence(rise: number, run: number, slopeText: string) {
  const riseFmt = formatValue(rise);
  const runFmt = formatValue(run);
  const absRun = formatValue(Math.abs(run));
  if (riseFmt.zero || Math.abs(rise) < 1e-9) {
    return `Rise 0, run ${runFmt.text}. The line is flat, slope 0.`;
  }
  const slope = rise / run;
  const direction = slope > 0 ? "climbs" : "drops";
  const absRise = formatValue(Math.abs(rise));
  const units = absRise.absText === "1" ? "unit" : "units";
  const steps = absRun.absText === "1" ? "unit" : "units";
  return `Rise ${riseFmt.text}, run ${runFmt.text}. The line ${direction} ${absRise.absText} ${units} for every ${absRun.absText} ${steps} to the right, slope ${slopeText}.`;
}

export function lineReadout(b: number, point: PlanePoint): LineReadout {
  const placed = { x: clean(point.x), y: clean(point.y) };
  if (Math.abs(placed.x) < 1e-9) {
    return {
      m: null,
      b,
      run: 0,
      rise: clean(placed.y - b),
      vertical: true,
      point: { x: 0, y: placed.y },
      slopeText: "undefined",
      interceptText: "—",
      slopeSpoken: "undefined",
      interceptSpoken: "none",
      equation: "x = 0",
      equationSpoken: "x equals 0",
      segment: clipVertical(0),
      triangle: null,
      caption: "Undefined slope. The line is vertical, x = 0.",
      announcement: "Undefined slope. The line is vertical, x equals 0.",
    };
  }
  const rise = clean(placed.y - b);
  const run = placed.x;
  const m = rise / run;
  const slope = formatValue(m);
  const intercept = formatValue(b);
  const equation = equationOf(slope, intercept);
  const triangle = triangleFor(b, placed);
  const caption = triangle
    ? climbSentence(triangle.rise, triangle.run, slope.text)
    : `Slope ${slope.text}, intercept ${intercept.text}.`;
  const riseVoice = triangle
    ? ` Rise ${formatValue(triangle.rise).spoken}, run ${formatValue(triangle.run).spoken}.`
    : "";
  return {
    m,
    b,
    run,
    rise,
    vertical: false,
    point: placed,
    slopeText: slope.text,
    interceptText: intercept.text,
    slopeSpoken: slope.spoken,
    interceptSpoken: intercept.spoken,
    equation: equation.text,
    equationSpoken: equation.spoken,
    segment: clipLine(m, b),
    triangle,
    caption,
    announcement: `Slope ${slope.spoken}, intercept ${intercept.spoken}. ${equation.spoken}.${riseVoice}`,
  };
}

export function placeSlopePoint(pointerX: number, pointerY: number, b: number, snap: boolean): PlanePoint {
  const step = gridStep(snap);
  const quantize = (value: number) => clamp(roundTo(value, step), -PLANE, PLANE);
  const seed = { x: quantize(pointerX), y: quantize(pointerY) };
  if (!overlapsIntercept(seed, b)) return seed;
  let best: PlanePoint | null = null;
  let bestDistance = Infinity;
  for (let ring = 1; ring <= PLANE * 2; ring += 1) {
    for (let i = -ring; i <= ring; i += 1) {
      for (let j = -ring; j <= ring; j += 1) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
        const candidate = { x: quantize(seed.x + i * step), y: quantize(seed.y + j * step) };
        if (overlapsIntercept(candidate, b)) continue;
        const distance = Math.hypot(candidate.x - pointerX, candidate.y - pointerY);
        if (distance < bestDistance - 1e-9) {
          best = candidate;
          bestDistance = distance;
        }
      }
    }
    if (best) return best;
  }
  const fallbackX = seed.x === 0 ? (pointerX < 0 ? -step : step) : seed.x;
  const fallbackY = nearly(seed.y, b) ? clamp(seed.y + step, -PLANE, PLANE) : seed.y;
  return { x: clamp(fallbackX, -PLANE, PLANE), y: fallbackY };
}

export function nudgeSlopePoint(
  point: PlanePoint,
  b: number,
  dx: number,
  dy: number,
  snap: boolean,
): PlanePoint {
  const step = gridStep(snap);
  const target = {
    x: clamp(roundTo(point.x + dx * step, step), -PLANE, PLANE),
    y: clamp(roundTo(point.y + dy * step, step), -PLANE, PLANE),
  };
  if (overlapsIntercept(target, b)) return { x: point.x, y: point.y };
  return target;
}

/** Move one grid step so the slope increases, or step off a vertical line. */
export function stepSlopePoint(point: PlanePoint, b: number, direction: -1 | 1, snap: boolean): PlanePoint {
  if (Math.abs(point.x) < 1e-9) return nudgeSlopePoint(point, b, direction, 0, snap);
  return nudgeSlopePoint(point, b, 0, direction * Math.sign(point.x), snap);
}

export function placeIntercept(pointerY: number, snap: boolean, point: PlanePoint, prefer: -1 | 0 | 1 = 0) {
  const step = gridStep(snap);
  let next = clamp(roundTo(pointerY, step), B_MIN, B_MAX);
  if (!(Math.abs(point.x) < 1e-9 && nearly(next, point.y))) return next;
  const lower = clamp(roundTo(next - step, step), B_MIN, B_MAX);
  const upper = clamp(roundTo(next + step, step), B_MIN, B_MAX);
  if (prefer > 0 && !nearly(upper, point.y)) return upper;
  if (prefer < 0 && !nearly(lower, point.y)) return lower;
  if (!nearly(lower, point.y)) return lower;
  return upper;
}

export function followIntercept(point: PlanePoint, prevB: number, nextB: number, snap: boolean): PlanePoint {
  const step = gridStep(snap);
  if (Math.abs(point.x) < 1e-9) {
    let y = clamp(roundTo(point.y + (nextB - prevB), step), -PLANE, PLANE);
    if (nearly(y, nextB)) {
      const direction = Math.sign(point.y - prevB) || 1;
      const shifted = clamp(roundTo(nextB + direction * step, step), -PLANE, PLANE);
      y = nearly(shifted, nextB) ? clamp(nextB - direction * step, -PLANE, PLANE) : shifted;
    }
    return { x: 0, y };
  }
  return { x: point.x, y: clamp(roundTo(nextB + (point.y - prevB), step), -PLANE, PLANE) };
}

export function pointFromSlope(m: number, b: number, x: number, snap: boolean): PlanePoint {
  const run = Math.abs(x) < 1e-9 ? (m >= 0 ? 1 : -1) : x;
  if (!Number.isFinite(m)) return placeSlopePoint(run, b, b, snap);
  return placeSlopePoint(run, b + m * run, b, snap);
}

export function snapHandles(b: number, point: PlanePoint) {
  const nextB = placeIntercept(b, true, point);
  return { b: nextB, point: placeSlopePoint(point.x, point.y, nextB, true) };
}

export function linesMatch(
  left: { m: number | null; b: number; vertical?: boolean },
  right: { m: number | null; b: number; vertical?: boolean },
) {
  if (left.vertical || right.vertical || left.m === null || right.m === null) return false;
  if (!Number.isFinite(left.m) || !Number.isFinite(right.m)) return false;
  return Math.abs(left.m - right.m) < 1e-6 && Math.abs(left.b - right.b) < 1e-6;
}

export function openingFor(target: MatchTarget) {
  const start = { m: START_M, b: START_B };
  if (linesMatch(start, target)) return { m: 1, b: 0 };
  return start;
}

export function pointList(points: readonly { x: number; y: number }[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}
