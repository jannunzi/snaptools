/**
 * Unit circle in standard position: 0 on the positive x-axis,
 * counterclockwise, angles kept in [0, 2π).
 * Common angles are the 30° and 45° families (π/6, π/4, π/3, π/2, …).
 */

export const TAU = Math.PI * 2;
export const START_RADIANS = Math.PI / 4;

const MINUS = "−";

export const RATIO_IDS = ["sin", "cos", "tan", "csc", "sec", "cot"] as const;
export type RatioId = (typeof RATIO_IDS)[number];

export type PrimaryUnit = "degrees" | "radians";

export type CommonAngle = {
  id: string;
  degrees: number;
  /** Radians = piNum * π / piDen. */
  piNum: number;
  piDen: number;
};

export const COMMON_ANGLES: readonly CommonAngle[] = [
  { id: "0", degrees: 0, piNum: 0, piDen: 1 },
  { id: "30", degrees: 30, piNum: 1, piDen: 6 },
  { id: "45", degrees: 45, piNum: 1, piDen: 4 },
  { id: "60", degrees: 60, piNum: 1, piDen: 3 },
  { id: "90", degrees: 90, piNum: 1, piDen: 2 },
  { id: "120", degrees: 120, piNum: 2, piDen: 3 },
  { id: "135", degrees: 135, piNum: 3, piDen: 4 },
  { id: "150", degrees: 150, piNum: 5, piDen: 6 },
  { id: "180", degrees: 180, piNum: 1, piDen: 1 },
  { id: "210", degrees: 210, piNum: 7, piDen: 6 },
  { id: "225", degrees: 225, piNum: 5, piDen: 4 },
  { id: "240", degrees: 240, piNum: 4, piDen: 3 },
  { id: "270", degrees: 270, piNum: 3, piDen: 2 },
  { id: "300", degrees: 300, piNum: 5, piDen: 3 },
  { id: "315", degrees: 315, piNum: 7, piDen: 4 },
  { id: "330", degrees: 330, piNum: 11, piDen: 6 },
];

const REFERENCE: Record<0 | 30 | 45 | 60 | 90, Record<RatioId, string>> = {
  0: { sin: "0", cos: "1", tan: "0", csc: "undefined", sec: "1", cot: "undefined" },
  30: { sin: "1/2", cos: "√3/2", tan: "√3/3", csc: "2", sec: "2√3/3", cot: "√3" },
  45: { sin: "√2/2", cos: "√2/2", tan: "1", csc: "√2", sec: "√2", cot: "1" },
  60: { sin: "√3/2", cos: "1/2", tan: "√3", csc: "2√3/3", sec: "2", cot: "√3/3" },
  90: { sin: "1", cos: "0", tan: "undefined", csc: "1", sec: "undefined", cot: "0" },
};

const SPOKEN_TOKENS: readonly [string, string][] = [
  ["2√3/3", "2 square root of 3 over 3"],
  ["√3/3", "square root of 3 over 3"],
  ["√3/2", "square root of 3 over 2"],
  ["√2/2", "square root of 2 over 2"],
  ["√3", "square root of 3"],
  ["√2", "square root of 2"],
  ["1/2", "1 over 2"],
];

export type RatioReadout = {
  id: RatioId;
  text: string;
  spoken: string;
  defined: boolean;
};

export type CircleModel = {
  radians: number;
  degrees: number;
  common: CommonAngle | null;
  degreeText: string;
  radianText: string;
  radianSpoken: string;
  turnText: string;
  turnSpoken: string;
  quadrant: string;
  x: number;
  y: number;
  ratios: Record<RatioId, RatioReadout>;
  caption: string;
  announcement: string;
};

export function normalizeRadians(radians: number) {
  if (!Number.isFinite(radians)) return 0;
  const wrapped = radians % TAU;
  return wrapped < 0 ? wrapped + TAU : wrapped;
}

export function radiansOf(angle: CommonAngle) {
  return (angle.piNum * Math.PI) / angle.piDen;
}

export function circularDistance(left: number, right: number) {
  const delta = Math.abs(normalizeRadians(left) - normalizeRadians(right));
  return Math.min(delta, TAU - delta);
}

export function matchingCommon(radians: number, epsilon = 1e-6) {
  const target = normalizeRadians(radians);
  for (const angle of COMMON_ANGLES) {
    if (circularDistance(target, radiansOf(angle)) <= epsilon) return angle;
  }
  return null;
}

export function snapToCommon(radians: number) {
  const target = normalizeRadians(radians);
  let best = COMMON_ANGLES[0];
  let bestDistance = Infinity;
  for (const angle of COMMON_ANGLES) {
    const distance = circularDistance(target, radiansOf(angle));
    if (distance < bestDistance) {
      best = angle;
      bestDistance = distance;
    }
  }
  return radiansOf(best);
}

export function stepCommon(radians: number, direction: -1 | 1) {
  const snapped = matchingCommon(snapToCommon(radians));
  const index = COMMON_ANGLES.findIndex((angle) => angle.id === snapped?.id);
  const next = (index + direction + COMMON_ANGLES.length) % COMMON_ANGLES.length;
  return radiansOf(COMMON_ANGLES[next]);
}

export function nudgeDegrees(radians: number, deltaDegrees: number) {
  return normalizeRadians(radians + (deltaDegrees * Math.PI) / 180);
}

export function angleFromPoint(x: number, y: number) {
  if (x === 0 && y === 0) return 0;
  return normalizeRadians(Math.atan2(y, x));
}

export function pointOnCircle(radians: number) {
  const theta = normalizeRadians(radians);
  return { x: Math.cos(theta), y: Math.sin(theta) };
}

function gcd(left: number, right: number) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
}

function formatDecimal(value: number) {
  if (!Number.isFinite(value)) return "undefined";
  const sign = value < 0 ? MINUS : "";
  const magnitude = Math.abs(value);
  if (magnitude < 5e-4) return "0";
  const digits = magnitude >= 100 ? 1 : magnitude >= 10 ? 2 : 3;
  const text = magnitude.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  return `${sign}${text}`;
}

export function radianLabel(angle: CommonAngle) {
  if (angle.piNum === 0) return "0";
  if (angle.piDen === 1) return angle.piNum === 1 ? "π" : `${angle.piNum}π`;
  if (angle.piNum === 1) return `π/${angle.piDen}`;
  return `${angle.piNum}π/${angle.piDen}`;
}

function radianSpoken(angle: CommonAngle) {
  if (angle.piNum === 0) return "0 radians";
  if (angle.piDen === 1) return angle.piNum === 1 ? "pi radians" : `${angle.piNum} pi radians`;
  if (angle.piNum === 1) return `pi over ${angle.piDen} radians`;
  return `${angle.piNum} pi over ${angle.piDen} radians`;
}

function degreeText(radians: number, common: CommonAngle | null) {
  if (common) return `${common.degrees}°`;
  const degrees = (normalizeRadians(radians) * 180) / Math.PI;
  if (Math.abs(degrees - Math.round(degrees)) < 0.05) return `${Math.round(degrees)}°`;
  return `${degrees.toFixed(1)}°`;
}

function turnParts(radians: number, common: CommonAngle | null) {
  if (common) {
    if (common.degrees === 0) return { text: "0 turns", spoken: "0 turns" };
    const divisor = gcd(common.degrees, 360);
    const numerator = common.degrees / divisor;
    const denominator = 360 / divisor;
    if (denominator === 1) {
      const text = `${numerator} ${numerator === 1 ? "turn" : "turns"}`;
      return { text, spoken: text };
    }
    return {
      text: `${numerator}/${denominator} turn`,
      spoken: `${numerator} over ${denominator} of a turn`,
    };
  }
  const turns = normalizeRadians(radians) / TAU;
  const text = `${turns.toFixed(2)} turns`;
  return { text, spoken: text };
}

function quadrantLabel(degrees: number) {
  const wrapped = ((degrees % 360) + 360) % 360;
  if (
    circularDistance((wrapped * Math.PI) / 180, 0) < 1e-6 ||
    Math.abs(wrapped - 90) < 1e-4 ||
    Math.abs(wrapped - 180) < 1e-4 ||
    Math.abs(wrapped - 270) < 1e-4
  ) {
    return "On the axis";
  }
  if (wrapped < 90) return "Quadrant I";
  if (wrapped < 180) return "Quadrant II";
  if (wrapped < 270) return "Quadrant III";
  return "Quadrant IV";
}

function speakMath(text: string) {
  let spoken = text.replaceAll(MINUS, "negative ");
  for (const [token, words] of SPOKEN_TOKENS) {
    spoken = spoken.replaceAll(token, words);
  }
  return spoken.replace(/\s+/g, " ").trim();
}

function withSign(text: string, sign: -1 | 1) {
  if (text === "0" || text === "undefined" || sign > 0) return text;
  return `${MINUS}${text}`;
}

function referenceDegrees(degrees: number): 0 | 30 | 45 | 60 | 90 {
  const wrapped = ((degrees % 360) + 360) % 360;
  const reference =
    wrapped <= 90 ? wrapped : wrapped <= 180 ? 180 - wrapped : wrapped <= 270 ? wrapped - 180 : 360 - wrapped;
  if (reference === 0 || reference === 30 || reference === 45 || reference === 60 || reference === 90) {
    return reference;
  }
  return 0;
}

function signsFor(degrees: number): Record<RatioId, -1 | 1> {
  const wrapped = ((degrees % 360) + 360) % 360;
  const sin: -1 | 1 = wrapped > 180 && wrapped < 360 ? -1 : 1;
  const cos: -1 | 1 = wrapped > 90 && wrapped < 270 ? -1 : 1;
  const tan: -1 | 1 = sin * cos === -1 ? -1 : 1;
  return { sin, cos, tan, csc: sin, sec: cos, cot: tan };
}

function exactRatios(angle: CommonAngle): Record<RatioId, RatioReadout> {
  const table = REFERENCE[referenceDegrees(angle.degrees)];
  const signs = signsFor(angle.degrees);
  const ratios = {} as Record<RatioId, RatioReadout>;
  for (const id of RATIO_IDS) {
    const text = withSign(table[id], signs[id]);
    ratios[id] = {
      id,
      text,
      spoken: speakMath(text),
      defined: text !== "undefined",
    };
  }
  return ratios;
}

function decimalRatios(radians: number): Record<RatioId, RatioReadout> {
  const theta = normalizeRadians(radians);
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  const values: Record<RatioId, number> = {
    sin,
    cos,
    tan: cos === 0 ? Number.NaN : sin / cos,
    csc: sin === 0 ? Number.NaN : 1 / sin,
    sec: cos === 0 ? Number.NaN : 1 / cos,
    cot: sin === 0 ? Number.NaN : cos / sin,
  };
  const ratios = {} as Record<RatioId, RatioReadout>;
  for (const id of RATIO_IDS) {
    const value = values[id];
    const defined = Number.isFinite(value) && Math.abs(value) < 1e6;
    const text = defined ? formatDecimal(value) : "undefined";
    ratios[id] = { id, text, spoken: speakMath(text), defined };
  }
  return ratios;
}

export function circleModel(radians: number, showTurns: boolean): CircleModel {
  const theta = normalizeRadians(radians);
  const common = matchingCommon(theta);
  const degrees = common ? common.degrees : (theta * 180) / Math.PI;
  const point = pointOnCircle(theta);
  const ratios = common ? exactRatios(common) : decimalRatios(theta);
  const turn = turnParts(theta, common);
  const radianText = common ? radianLabel(common) : formatDecimal(theta);
  const spokenRadians = common ? radianSpoken(common) : `${formatDecimal(theta).replaceAll(MINUS, "negative ")} radians`;
  const degreesLabel = common ? `${common.degrees} degrees` : `${degreeText(theta, null).replace("°", "")} degrees`;
  const turnClause = showTurns ? `, ${turn.text}` : "";
  const turnSpoken = showTurns ? `, ${turn.spoken}` : "";
  const caption = `${degreeText(theta, common)}, ${radianText} radians${turnClause}. Coordinates (${ratios.cos.text}, ${ratios.sin.text}).`;
  const announcement = `${degreesLabel}, ${spokenRadians}${turnSpoken}. Coordinates cosine ${ratios.cos.spoken}, sine ${ratios.sin.spoken}.`;

  return {
    radians: theta,
    degrees,
    common,
    degreeText: degreeText(theta, common),
    radianText,
    radianSpoken: spokenRadians,
    turnText: turn.text,
    turnSpoken: turn.spoken,
    quadrant: quadrantLabel(degrees),
    x: point.x,
    y: point.y,
    ratios,
    caption,
    announcement,
  };
}

export function arcPoints(endRadians: number, radius: number) {
  const end = normalizeRadians(endRadians);
  if (end < 1e-4) return [];
  const count = Math.max(8, Math.ceil(48 * (end / TAU)));
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index <= count; index += 1) {
    const theta = (end * index) / count;
    points.push({ x: Math.cos(theta) * radius, y: Math.sin(theta) * radius });
  }
  return points;
}

export function pointList(points: readonly { x: number; y: number }[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}
