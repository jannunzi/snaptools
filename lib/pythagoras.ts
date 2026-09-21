/**
 * Right triangle with the right angle fixed at C.
 * Leg a runs along the bottom, leg b up the side, hypotenuse c opposite C.
 * Squares sit outward on each side. The square on c splits into two rectangles
 * whose areas are a² and b².
 */

export const LEG_MIN = 1;
export const LEG_MAX = 30;
export const EXPLORE_LEGS = { a: 3, b: 4 } as const;
export const GRID_MAX = 18;

export const TRIPLES = [
  { id: "3-4-5", a: 3, b: 4, name: "3–4–5" },
  { id: "6-8-10", a: 6, b: 8, name: "6–8–10" },
  { id: "5-12-13", a: 5, b: 12, name: "5–12–13" },
  { id: "9-12-15", a: 9, b: 12, name: "9–12–15" },
  { id: "8-15-17", a: 8, b: 15, name: "8–15–17" },
  { id: "7-24-25", a: 7, b: 24, name: "7–24–25" },
  { id: "20-21-29", a: 20, b: 21, name: "20–21–29" },
] as const;

export type TripleId = (typeof TRIPLES)[number]["id"];
export type LabMode = "explore" | "missing" | "triples";
export type MissingSide = "a" | "b" | "c";
export type CheckStatus = "pending" | "correct" | "wrong" | "area";

export type Puzzle = {
  id: string;
  a: number;
  b: number;
  missing: MissingSide;
};

export const PUZZLES: readonly Puzzle[] = [
  { id: "c-3-4", a: 3, b: 4, missing: "c" },
  { id: "c-6-8", a: 6, b: 8, missing: "c" },
  { id: "c-5-12", a: 5, b: 12, missing: "c" },
  { id: "a-6-8", a: 6, b: 8, missing: "a" },
  { id: "b-9-12", a: 9, b: 12, missing: "b" },
  { id: "c-8-15", a: 8, b: 15, missing: "c" },
  { id: "c-7-24", a: 7, b: 24, missing: "c" },
  { id: "c-20-21", a: 20, b: 21, missing: "c" },
];

export type Point = { x: number; y: number };
export type Segment = { x1: number; y1: number; x2: number; y2: number };

export type Measures = {
  a: number;
  b: number;
  c: number;
  a2: number;
  b2: number;
  c2: number;
  whole: boolean;
};

export type Figure = {
  measures: Measures;
  C: Point;
  A: Point;
  B: Point;
  squareA: Point[];
  squareB: Point[];
  squareC: Point[];
  rectA: Point[];
  rectB: Point[];
  split: Segment;
  rightAngle: Point[];
  gridA: Segment[];
  gridB: Segment[];
  gridC: Segment[];
  labels: {
    a: Point;
    b: Point;
    c: Point;
    a2: Point;
    b2: Point;
    c2: Point;
    rectA: Point;
    rectB: Point;
  };
  labelSize: { a: number; b: number; c: number; side: number };
  showRectLabel: { a: boolean; b: boolean };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  span: number;
};

export function near(left: number, right: number, epsilon = 1e-6) {
  return Math.abs(left - right) <= epsilon;
}

export function nearInt(value: number, epsilon = 1e-6) {
  return near(value, Math.round(value), epsilon);
}

export function clampLeg(value: number, snap: boolean) {
  const clamped = Math.min(LEG_MAX, Math.max(LEG_MIN, value));
  if (snap) return Math.min(LEG_MAX, Math.max(LEG_MIN, Math.round(clamped)));
  return Math.round(clamped * 100) / 100;
}

export function stepLeg(value: number, direction: -1 | 1, snap: boolean) {
  if (snap) return clampLeg(Math.round(value) + direction, true);
  return clampLeg(value + direction * 0.1, false);
}

export function measure(a: number, b: number): Measures {
  const a2 = a * a;
  const b2 = b * b;
  const c = Math.hypot(a, b);
  return {
    a,
    b,
    c,
    a2,
    b2,
    c2: a2 + b2,
    whole: nearInt(a) && nearInt(b) && nearInt(c),
  };
}

export function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function trimRounded(value: number, digits: number) {
  const text = roundTo(value, digits).toFixed(digits);
  if (!text.includes(".")) return text;
  return text.replace(/0+$/, "").replace(/\.$/, "");
}

export function formatMeasure(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (nearInt(value, 1e-4)) return String(Math.round(value));
  return trimRounded(value, 2);
}

export function equationParts(a2: number, b2: number, c2: number) {
  const start = [a2, b2, c2].every((value) => nearInt(value, 1e-4)) ? 0 : 2;
  for (let digits = start; digits <= 4; digits += 1) {
    const leftA = roundTo(a2, digits);
    const leftB = roundTo(b2, digits);
    const right = roundTo(c2, digits);
    if (Math.abs(leftA + leftB - right) <= 1e-8) {
      return {
        a2: trimRounded(leftA, digits),
        b2: trimRounded(leftB, digits),
        c2: trimRounded(right, digits),
      };
    }
  }
  const leftA = roundTo(a2, 4);
  const leftB = roundTo(b2, 4);
  return {
    a2: trimRounded(leftA, 4),
    b2: trimRounded(leftB, 4),
    c2: trimRounded(leftA + leftB, 4),
  };
}

export function equationText(measures: Measures) {
  const parts = equationParts(measures.a2, measures.b2, measures.c2);
  return `${parts.a2} + ${parts.b2} = ${parts.c2}`;
}

export function identityHolds(measures: Measures) {
  return Math.abs(measures.a2 + measures.b2 - measures.c2) <= 1e-6;
}

export function matchingTriple(a: number, b: number) {
  return TRIPLES.find((triple) => near(triple.a, a, 1e-4) && near(triple.b, b, 1e-4)) ?? null;
}

export function puzzleC(puzzle: Puzzle) {
  return Math.hypot(puzzle.a, puzzle.b);
}

export function puzzleAnswer(puzzle: Puzzle) {
  if (puzzle.missing === "a") return puzzle.a;
  if (puzzle.missing === "b") return puzzle.b;
  return puzzleC(puzzle);
}

export function puzzleStart(puzzle: Puzzle) {
  if (puzzle.missing === "c") return { a: puzzle.a, b: puzzle.b };
  if (puzzle.missing === "a") {
    const bumped = puzzle.a > 4 ? puzzle.a - 2 : puzzle.a + 2;
    return { a: clampLeg(bumped, true), b: puzzle.b };
  }
  const bumped = puzzle.b > 4 ? puzzle.b - 2 : puzzle.b + 2;
  return { a: puzzle.a, b: clampLeg(bumped, true) };
}

export function answerMatches(input: number, answer: number) {
  if (!Number.isFinite(input)) return false;
  return Math.abs(input - answer) <= 0.05;
}

export function gradeAnswer(input: number, puzzle: Puzzle): CheckStatus {
  if (!Number.isFinite(input)) return "wrong";
  if (answerMatches(input, puzzleAnswer(puzzle))) return "correct";
  if (puzzle.missing === "c" && answerMatches(input, puzzle.a * puzzle.a + puzzle.b * puzzle.b)) {
    return "area";
  }
  return "wrong";
}

export function legLocked(mode: LabMode, puzzle: Puzzle | null, leg: "a" | "b") {
  if (mode !== "missing" || !puzzle) return false;
  if (puzzle.missing === "c") return true;
  return puzzle.missing !== leg;
}

export function modePrompt(mode: LabMode, puzzle: Puzzle | null) {
  if (mode === "triples") {
    return "These right triangles have whole-number sides. Tap one and compare the squares.";
  }
  if (mode === "missing" && puzzle) return puzzlePrompt(puzzle);
  return "Drag a corner. The right angle stays put, and the squares show the areas.";
}

export function puzzlePrompt(puzzle: Puzzle) {
  if (puzzle.missing === "c") {
    return `Legs a = ${puzzle.a} and b = ${puzzle.b}. What is the hypotenuse?`;
  }
  if (puzzle.missing === "a") {
    return `Leg b is ${puzzle.b} and the hypotenuse should be ${formatMeasure(puzzleC(puzzle))}. Find leg a.`;
  }
  return `Leg a is ${puzzle.a} and the hypotenuse should be ${formatMeasure(puzzleC(puzzle))}. Find leg b.`;
}

export function describePythagoras(options: {
  mode: LabMode;
  measures: Measures;
  why: boolean;
  puzzle: Puzzle | null;
  status: CheckStatus;
  tripleName: string | null;
}) {
  const { mode, measures, why, puzzle, status, tripleName } = options;
  const sides = `Leg a ${formatMeasure(measures.a)}, leg b ${formatMeasure(measures.b)}, hypotenuse c ${formatMeasure(measures.c)}.`;
  const areas = `Areas ${formatMeasure(measures.a2)}, ${formatMeasure(measures.b2)}, and ${formatMeasure(measures.c2)}.`;
  const match = `${equationText(measures)}. The areas match.`;
  const whyLine = why ? " The square on c is split into the two leg areas." : "";
  const named = tripleName ? ` The ${tripleName} triple.` : measures.whole ? " Whole-number sides." : "";

  if (mode === "missing" && puzzle && status !== "correct") {
    if (puzzle.missing === "c") {
      const hidden = `Leg a ${formatMeasure(puzzle.a)}, leg b ${formatMeasure(puzzle.b)}. Areas ${formatMeasure(puzzle.a * puzzle.a)} and ${formatMeasure(puzzle.b * puzzle.b)}. The hypotenuse is hidden.`;
      if (status === "area") return `${hidden} That number is the area of the big square. Type the side length.`;
      if (status === "wrong") return `${hidden} Not yet.`;
      return hidden;
    }
    const target = formatMeasure(puzzleC(puzzle));
    const dragging =
      puzzle.missing === "a"
        ? `Leg b is ${formatMeasure(puzzle.b)}. Hypotenuse now ${formatMeasure(measures.c)}. Make it ${target}.`
        : `Leg a is ${formatMeasure(puzzle.a)}. Hypotenuse now ${formatMeasure(measures.c)}. Make it ${target}.`;
    if (status === "wrong") return `${dragging} Not yet.`;
    return dragging;
  }

  if (mode === "missing" && puzzle && status === "correct") {
    return `Yes. ${puzzle.missing} is ${formatMeasure(puzzleAnswer(puzzle))}. ${match}`;
  }

  return `${sides} ${areas} ${match}${named}${whyLine}`;
}

function add(left: Point, right: Point): Point {
  return { x: left.x + right.x, y: left.y + right.y };
}

function mul(point: Point, scale: number): Point {
  return { x: point.x * scale, y: point.y * scale };
}

function centroid(points: readonly Point[]): Point {
  const total = points.reduce((sum, point) => add(sum, point), { x: 0, y: 0 });
  return mul(total, 1 / points.length);
}

function dist(left: Point, right: Point) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function shorterSide(points: readonly Point[]) {
  return Math.min(dist(points[0], points[1]), dist(points[1], points[2]));
}

export function polygonArea(points: readonly Point[]) {
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    sum += points[index].x * next.y - next.x * points[index].y;
  }
  return Math.abs(sum) / 2;
}

function gridOnSquare(origin: Point, across: Point, outward: Point, cells: number): Segment[] {
  const lines: Segment[] = [];
  for (let index = 1; index < cells; index += 1) {
    const t = index / cells;
    const along = add(origin, mul(across, t));
    const out = add(origin, mul(outward, t));
    lines.push({ x1: along.x, y1: along.y, x2: along.x + outward.x, y2: along.y + outward.y });
    lines.push({ x1: out.x, y1: out.y, x2: out.x + across.x, y2: out.y + across.y });
  }
  return lines;
}

function integerCells(length: number) {
  if (!nearInt(length, 1e-4)) return null;
  const cells = Math.round(length);
  if (cells < 2 || cells > GRID_MAX) return null;
  return cells;
}

export function figure(a: number, b: number): Figure {
  const measures = measure(a, b);
  const { c } = measures;
  const C = { x: 0, y: 0 };
  const A = { x: a, y: 0 };
  const B = { x: 0, y: b };
  const squareA = [C, A, { x: a, y: -a }, { x: 0, y: -a }];
  const squareB = [C, B, { x: -b, y: b }, { x: -b, y: 0 }];
  const outward = { x: b, y: a };
  const squareC = [A, B, add(B, outward), add(A, outward)];
  const along = { x: B.x - A.x, y: B.y - A.y };
  const t = (a * a) / (c * c);
  const H = add(A, mul(along, t));
  const Hp = add(H, outward);
  const rectA = [A, H, Hp, add(A, outward)];
  const rectB = [H, B, add(B, outward), Hp];
  const spanX = a + 2 * b;
  const spanY = 2 * a + b;
  const span = Math.max(spanX, spanY);
  const mark = Math.min(Math.min(a, b) * 0.28, Math.max(span * 0.035, Math.min(a, b) * 0.16));
  const nudge = Math.min(a, b) * 0.2;
  const inward = { x: -b / c, y: -a / c };
  const midC = centroid(squareC);
  const cellsA = integerCells(a);
  const cellsB = integerCells(b);
  const cellsC = integerCells(c);
  const sideFont = Math.min(span * 0.042, Math.min(a, b) * 0.22);

  return {
    measures,
    C,
    A,
    B,
    squareA,
    squareB,
    squareC,
    rectA,
    rectB,
    split: { x1: H.x, y1: H.y, x2: Hp.x, y2: Hp.y },
    rightAngle: [
      { x: mark, y: 0 },
      { x: mark, y: mark },
      { x: 0, y: mark },
    ],
    gridA: cellsA ? gridOnSquare(C, { x: a, y: 0 }, { x: 0, y: -a }, cellsA) : [],
    gridB: cellsB ? gridOnSquare(C, { x: 0, y: b }, { x: -b, y: 0 }, cellsB) : [],
    gridC: cellsC ? gridOnSquare(A, along, outward, cellsC) : [],
    labels: {
      a: { x: a / 2, y: nudge },
      b: { x: nudge, y: b / 2 },
      c: add(add(A, mul(along, 0.5)), mul(inward, nudge * 1.35)),
      a2: centroid(squareA),
      b2: centroid(squareB),
      c2: midC,
      rectA: centroid(rectA),
      rectB: centroid(rectB),
    },
    labelSize: {
      a: Math.min(span * 0.07, a * 0.42),
      b: Math.min(span * 0.07, b * 0.42),
      c: Math.min(span * 0.07, c * 0.34),
      side: sideFont,
    },
    showRectLabel: {
      a: shorterSide(rectA) > span * 0.07,
      b: shorterSide(rectB) > span * 0.07,
    },
    bounds: { minX: -b, minY: -a, maxX: a + b, maxY: a + b },
    span,
  };
}

export function pointList(points: readonly Point[]) {
  return points
    .map((point) => {
      const x = Math.round(point.x * 1000) / 1000;
      const y = Math.round(point.y * 1000) / 1000;
      return `${Object.is(x, -0) ? 0 : x},${Object.is(y, -0) ? 0 : y}`;
    })
    .join(" ");
}
