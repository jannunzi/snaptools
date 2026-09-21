/**
 * Slope–intercept lab: y = mx + b on a square coordinate plane.
 * Snap slopes are the fractions with denominator 1–4 inside [-4, 4].
 * Snap intercepts are halves inside [-6, 6].
 */

export const PLANE = 8;
export const M_MIN = -4;
export const M_MAX = 4;
export const B_MIN = -6;
export const B_MAX = 6;
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

export type LineReadout = {
  m: number;
  b: number;
  run: number;
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
  for (let half = -12; half <= 12; half += 1) values.push(half / 2);
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
  const rational = bestFraction(value, 4, FRACTION_EPSILON);
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

/** Positive run whose far corner stays inside the plane. */
export function visibleRun(m: number, b: number, requested: number) {
  const want = Number.isFinite(requested) ? requested : preferredRun(m);
  const limit = PLANE - 0.25;
  let maxX = 5;
  if (m > 0.0001) maxX = (limit - b) / m;
  else if (m < -0.0001) maxX = (-limit - b) / m;
  const room = Number.isFinite(maxX) ? Math.min(5, maxX) : 5;
  const integer = clamp(Math.round(want), 1, 5);
  if (integer <= room + 1e-6 && room >= 1) return integer;
  const floored = Math.floor(room);
  if (floored >= 1) return floored;
  return clamp(Math.round(Math.max(room, 0.7) * 100) / 100, 0.7, 5);
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

function triangleFor(m: number, b: number, run: number): TriangleGeometry | null {
  if (run < 0.9) return null;
  const y1 = b;
  const rise = m * run;
  const x1 = 0;
  const x2 = run;
  const y3 = y1 + rise;
  const limit = PLANE + 0.05;
  const inside = (x: number, y: number) => Math.abs(x) <= limit && Math.abs(y) <= limit;
  if (!inside(x1, y1) || !inside(x2, y1) || !inside(x2, y3)) return null;
  const riseFmt = formatValue(rise);
  const runFmt = formatValue(run);
  return {
    x1,
    y1,
    x2,
    y2: y1,
    x3: x2,
    y3,
    rise,
    run,
    riseText: riseFmt.text,
    runText: runFmt.text,
    showRise: Math.abs(rise) >= 0.05,
  };
}

function climbSentence(rise: number, runText: string, slopeText: string) {
  const riseFmt = formatValue(rise);
  if (riseFmt.zero) return `Rise 0, run ${runText}. The line is flat, slope 0.`;
  const direction = rise > 0 ? "climbs" : "drops";
  const units = riseFmt.absText === "1" ? "unit" : "units";
  const steps = runText === "1" ? "unit" : "units";
  return `Rise ${riseFmt.text}, run ${runText}. The line ${direction} ${riseFmt.absText} ${units} for every ${runText} ${steps} to the right, slope ${slopeText}.`;
}

export function lineReadout(m: number, b: number, requestedRun: number): LineReadout {
  const slope = formatValue(m);
  const intercept = formatValue(b);
  const equation = equationOf(slope, intercept);
  const run = visibleRun(m, b, requestedRun);
  const triangle = triangleFor(m, b, run);
  const caption = triangle
    ? climbSentence(triangle.rise, triangle.runText, slope.text)
    : `Slope ${slope.text}, intercept ${intercept.text}.`;
  const riseVoice = triangle
    ? ` Rise ${formatValue(triangle.rise).spoken}, run ${formatValue(triangle.run).spoken}.`
    : "";
  return {
    m,
    b,
    run,
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

export function interceptFromPoint(pointerY: number, snap: boolean) {
  if (snap) return snapIntercept(pointerY);
  return clamp(Math.round(pointerY * 10) / 10, B_MIN, B_MAX);
}

export function slopeFromPoint(pointerX: number, pointerY: number, b: number, snap: boolean) {
  const x = Math.max(pointerX, 0.7);
  const raw = (pointerY - b) / x;
  const m = snap ? snapSlope(raw) : clamp(Math.round(raw * 100) / 100, M_MIN, M_MAX);
  return { m, run: visibleRun(m, b, Math.round(x)) };
}

export function linesMatch(left: { m: number; b: number }, right: { m: number; b: number }) {
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
