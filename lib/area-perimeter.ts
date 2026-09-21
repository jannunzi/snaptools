/**
 * Area and perimeter for unit-square tiles.
 * Perimeter = 4 × area − 2 × shared edges. A side between two filled
 * squares is inside the shape, so it is not part of the walk around.
 */

export const GRID_SIZES = [8, 10, 12] as const;
export const DEFAULT_GRID = 10;
export const EXPLORE_RECT = { width: 4, height: 3 } as const;
export const TARGET_START = { width: 2, height: 2 } as const;

export const SIDES = ["top", "right", "bottom", "left"] as const;
export type Side = (typeof SIDES)[number];

export type Rect = {
  row: number;
  col: number;
  width: number;
  height: number;
};

export type Pair = {
  width: number;
  height: number;
};

export type Measurement = {
  area: number;
  perimeter: number;
  exposed: Record<string, Side[]>;
};

export type Verdict = "empty" | "pending" | "same" | "different" | "better" | "match";

const DELTAS: Record<Side, [number, number]> = {
  top: [-1, 0],
  right: [0, 1],
  bottom: [1, 0],
  left: [0, -1],
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function key(row: number, col: number) {
  return `${row},${col}`;
}

export function parseKey(id: string): [number, number] {
  const comma = id.indexOf(",");
  return [Number(id.slice(0, comma)), Number(id.slice(comma + 1))];
}

export function cellsFromRect(rect: Rect): string[] {
  if (rect.width <= 0 || rect.height <= 0) return [];
  const cells: string[] = [];
  for (let row = rect.row; row < rect.row + rect.height; row += 1) {
    for (let col = rect.col; col < rect.col + rect.width; col += 1) {
      cells.push(key(row, col));
    }
  }
  return cells;
}

export function placeRect(rows: number, cols: number, width: number, height: number): Rect {
  const nextWidth = clamp(width, 0, cols);
  const nextHeight = clamp(height, 0, rows);
  return {
    width: nextWidth,
    height: nextHeight,
    row: Math.max(0, Math.floor((rows - nextHeight) / 2)),
    col: Math.max(0, Math.floor((cols - nextWidth) / 2)),
  };
}

export function clampRect(rect: Rect, rows: number, cols: number): Rect {
  const width = clamp(rect.width, 0, cols);
  const height = clamp(rect.height, 0, rows);
  return {
    width,
    height,
    row: clamp(rect.row, 0, Math.max(0, rows - height)),
    col: clamp(rect.col, 0, Math.max(0, cols - width)),
  };
}

/** Grow or shrink from the current top-left, shifting back if the shape hits the edge. */
export function resizeRect(
  rect: Rect,
  width: number,
  height: number,
  rows: number,
  cols: number,
): Rect {
  const nextWidth = clamp(Math.round(width), 1, cols);
  const nextHeight = clamp(Math.round(height), 1, rows);
  return clampRect({ ...rect, width: nextWidth, height: nextHeight }, rows, cols);
}

export function cellsInside(cells: readonly string[], rows: number, cols: number) {
  return cells.filter((id) => {
    const [row, col] = parseKey(id);
    return row >= 0 && col >= 0 && row < rows && col < cols;
  });
}

export function boundingRect(cells: readonly string[]): Rect {
  if (cells.length === 0) return { row: 0, col: 0, width: 0, height: 0 };
  let minRow = Infinity;
  let minCol = Infinity;
  let maxRow = -Infinity;
  let maxCol = -Infinity;
  for (const id of cells) {
    const [row, col] = parseKey(id);
    if (row < minRow) minRow = row;
    if (col < minCol) minCol = col;
    if (row > maxRow) maxRow = row;
    if (col > maxCol) maxCol = col;
  }
  return {
    row: minRow,
    col: minCol,
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1,
  };
}

export function isSolidRectangle(cells: readonly string[]) {
  if (cells.length === 0) return false;
  const rect = boundingRect(cells);
  if (rect.width * rect.height !== cells.length) return false;
  return new Set(cells).size === cells.length;
}

export function measure(cells: readonly string[]): Measurement {
  const filled = new Set(cells);
  const exposed: Record<string, Side[]> = {};
  let area = 0;
  let shared = 0;
  for (const id of filled) {
    const [row, col] = parseKey(id);
    if (Number.isNaN(row) || Number.isNaN(col)) continue;
    area += 1;
    const sides: Side[] = [];
    for (const side of SIDES) {
      const [dRow, dCol] = DELTAS[side];
      if (filled.has(key(row + dRow, col + dCol))) {
        if (side === "right" || side === "bottom") shared += 1;
      } else {
        sides.push(side);
      }
    }
    exposed[id] = sides;
  }
  return { area, perimeter: area * 4 - shared * 2, exposed };
}

export function rectangleArea(width: number, height: number) {
  return width * height;
}

export function rectanglePerimeter(width: number, height: number) {
  return 2 * (width + height);
}

/** Largest area an integer rectangle can hold at this perimeter. */
export function maxRectangleArea(perimeter: number) {
  if (perimeter < 4 || perimeter % 2 !== 0) return null;
  const sum = perimeter / 2;
  const width = Math.floor(sum / 2);
  const height = sum - width;
  if (width < 1 || height < 1) return null;
  return width * height;
}

export function factorPairs(area: number, maxSide: number): Pair[] {
  const pairs: Pair[] = [];
  for (let width = 1; width <= maxSide; width += 1) {
    if (area % width !== 0) continue;
    const height = area / width;
    if (height >= 1 && height <= maxSide) pairs.push({ width, height });
  }
  return pairs;
}

function spread(pair: Pair) {
  return Math.abs(pair.width - pair.height);
}

/** Most square factor pair that fits, preferring a landscape orientation. */
export function mostSquarePair(area: number, maxSide: number): Pair | null {
  let best: Pair | null = null;
  for (const pair of factorPairs(area, maxSide)) {
    if (
      !best ||
      spread(pair) < spread(best) ||
      (spread(pair) === spread(best) && pair.width > best.width)
    ) {
      best = pair;
    }
  }
  return best;
}

export function stepAreaPair(
  current: Pair,
  pairs: readonly Pair[],
  toward: "square" | "bar",
): Pair | null {
  const score = spread(current);
  let best: Pair | null = null;
  let bestGap = Infinity;
  for (const pair of pairs) {
    const nextScore = spread(pair);
    const ok = toward === "square" ? nextScore < score : nextScore > score;
    if (!ok) continue;
    const gap = Math.abs(nextScore - score);
    const horizontal = pair.width >= pair.height;
    const bestHorizontal = best ? best.width >= best.height : false;
    if (
      !best ||
      gap < bestGap ||
      (gap === bestGap && horizontal && !bestHorizontal) ||
      (gap === bestGap && horizontal === bestHorizontal && pair.width > best.width)
    ) {
      best = pair;
      bestGap = gap;
    }
  }
  return best;
}

/** Step a rectangle while keeping width + height (and so the perimeter) fixed. */
export function stepPerimeterPair(
  current: Pair,
  toward: "square" | "bar",
  maxSide: number,
): Pair | null {
  let { width, height } = current;
  if (width < 1 || height < 1) return null;
  if (toward === "square") {
    if (width === height) return null;
    if (width > height) {
      width -= 1;
      height += 1;
    } else {
      width += 1;
      height -= 1;
    }
  } else if (width >= height) {
    width += 1;
    height -= 1;
  } else {
    width -= 1;
    height += 1;
  }
  if (width < 1 || height < 1 || width > maxSide || height > maxSide) return null;
  return { width, height };
}

export const PERIMETER_PRESETS = [
  { id: "p16", width: 7, height: 1 },
  { id: "p12", width: 5, height: 1 },
  { id: "p20", width: 9, height: 1 },
] as const;

export const AREA_PRESETS = [
  { id: "a8", area: 8 },
  { id: "a12", area: 12 },
  { id: "a6", area: 6 },
] as const;

export type TargetSpec = {
  id: string;
  area?: number;
  perimeter?: number;
  prompt: string;
  sample: Pair;
};

export const TARGETS: readonly TargetSpec[] = [
  {
    id: "a9-p12",
    area: 9,
    perimeter: 12,
    prompt: "Make area 9 and perimeter 12.",
    sample: { width: 3, height: 3 },
  },
  {
    id: "area-12",
    area: 12,
    prompt: "Make the area 12. Any perimeter is fine.",
    sample: { width: 4, height: 3 },
  },
  {
    id: "per-16",
    perimeter: 16,
    prompt: "Make the perimeter 16. Any area is fine.",
    sample: { width: 4, height: 4 },
  },
  {
    id: "a8-p12",
    area: 8,
    perimeter: 12,
    prompt: "Make area 8 and perimeter 12.",
    sample: { width: 4, height: 2 },
  },
  {
    id: "a8-p18",
    area: 8,
    perimeter: 18,
    prompt: "Make area 8 and perimeter 18.",
    sample: { width: 8, height: 1 },
  },
  {
    id: "a16-p16",
    area: 16,
    perimeter: 16,
    prompt: "Make area 16 and perimeter 16.",
    sample: { width: 4, height: 4 },
  },
  {
    id: "a6-p10",
    area: 6,
    perimeter: 10,
    prompt: "Make area 6 and perimeter 10.",
    sample: { width: 3, height: 2 },
  },
  {
    id: "a10-p14",
    area: 10,
    perimeter: 14,
    prompt: "Make area 10 and perimeter 14.",
    sample: { width: 5, height: 2 },
  },
  {
    id: "a12-p26",
    area: 12,
    perimeter: 26,
    prompt: "Make area 12 and perimeter 26.",
    sample: { width: 12, height: 1 },
  },
];

export function fits(pair: Pair, grid: number) {
  return pair.width <= grid && pair.height <= grid && pair.width >= 1 && pair.height >= 1;
}

export function perimeterChoices(grid: number) {
  return PERIMETER_PRESETS.filter((preset) => fits(preset, grid));
}

export function areaChoices(grid: number) {
  return AREA_PRESETS.filter((preset) => mostSquarePair(preset.area, grid) !== null);
}

export function targetChoices(grid: number) {
  return TARGETS.filter((target) => fits(target.sample, grid));
}

export function tilesPhrase(area: number) {
  return area === 1 ? "1 square" : `${area} squares`;
}

export function aroundPhrase(perimeter: number) {
  return perimeter === 1 ? "1 unit" : `${perimeter} units`;
}

export function rectanglePhrase(width: number, height: number) {
  if (width === height) return `${width} by ${height} square`;
  if (width === 1 || height === 1) return `${width} by ${height} bar`;
  return `${width} by ${height} rectangle`;
}

export function sizePhrase(width: number, height: number) {
  if (width <= 0 || height <= 0) return "";
  return `${rectanglePhrase(width, height)}.`;
}

export function samePerimeterPrompt(exampleArea: number, perimeter: number) {
  return `Keep the perimeter at ${perimeter}. The example has area ${exampleArea}. Make a different area — more squares if you can.`;
}

export function sameAreaPrompt(area: number, examplePerimeter: number) {
  return `Keep the area at ${area}. The example has perimeter ${examplePerimeter}. Make a different perimeter — a longer walk around if you can.`;
}

export function perimeterVerdict(
  area: number,
  perimeter: number,
  exampleArea: number,
  examplePerimeter: number,
): Verdict {
  if (area === 0) return "empty";
  if (perimeter !== examplePerimeter) return "pending";
  if (area === exampleArea) return "same";
  if (area > exampleArea) return "better";
  return "different";
}

export function areaVerdict(
  area: number,
  perimeter: number,
  exampleArea: number,
  examplePerimeter: number,
): Verdict {
  if (area === 0) return "empty";
  if (area !== exampleArea) return "pending";
  if (perimeter === examplePerimeter) return "same";
  if (perimeter > examplePerimeter) return "better";
  return "different";
}

export function targetVerdict(
  area: number,
  perimeter: number,
  target: { area?: number; perimeter?: number },
): Verdict {
  if (area === 0) return "empty";
  const areaOk = target.area === undefined || area === target.area;
  const perimeterOk = target.perimeter === undefined || perimeter === target.perimeter;
  return areaOk && perimeterOk ? "match" : "pending";
}

export function describeExplore(area: number, perimeter: number, shape: string) {
  const base = `Area ${tilesPhrase(area)}. Perimeter ${aroundPhrase(perimeter)}.`;
  return shape ? `${base} ${shape}` : base;
}

export function describeSamePerimeter(
  area: number,
  perimeter: number,
  exampleArea: number,
  examplePerimeter: number,
) {
  const verdict = perimeterVerdict(area, perimeter, exampleArea, examplePerimeter);
  const base = `Area ${tilesPhrase(area)}. Perimeter ${aroundPhrase(perimeter)}.`;
  if (verdict === "empty") {
    return `${base} Aim for perimeter ${examplePerimeter}.`;
  }
  if (verdict === "pending") {
    return `${base} Aim for perimeter ${examplePerimeter}, with an area other than ${exampleArea}.`;
  }
  if (verdict === "same") {
    return `${base} Same as the example. Change the shape.`;
  }
  if (verdict === "better") {
    const maxArea = maxRectangleArea(examplePerimeter);
    const peak =
      maxArea !== null && area === maxArea
        ? " A square holds the most area for this perimeter."
        : "";
    return `${base} Same perimeter as the example, and a bigger area.${peak}`;
  }
  return `${base} Same perimeter as the example, with a smaller area.`;
}

export function describeSameArea(
  area: number,
  perimeter: number,
  exampleArea: number,
  examplePerimeter: number,
) {
  const verdict = areaVerdict(area, perimeter, exampleArea, examplePerimeter);
  const base = `Area ${tilesPhrase(area)}. Perimeter ${aroundPhrase(perimeter)}.`;
  if (verdict === "empty") {
    return `${base} Aim for area ${exampleArea}.`;
  }
  if (verdict === "pending") {
    return `${base} Aim for area ${exampleArea}, with a perimeter other than ${examplePerimeter}.`;
  }
  if (verdict === "same") {
    return `${base} Same as the example. Stretch it into a longer bar.`;
  }
  if (verdict === "better") {
    return `${base} Same area as the example, and a longer perimeter.`;
  }
  return `${base} Same area as the example, and a shorter perimeter.`;
}

export function describeTarget(
  area: number,
  perimeter: number,
  target: { area?: number; perimeter?: number },
) {
  const base = `Area ${tilesPhrase(area)}. Perimeter ${aroundPhrase(perimeter)}.`;
  if (targetVerdict(area, perimeter, target) === "match") {
    return `${base} That matches the target.`;
  }
  const parts: string[] = [];
  if (target.area !== undefined) parts.push(`area ${target.area}`);
  if (target.perimeter !== undefined) parts.push(`perimeter ${target.perimeter}`);
  return `${base} Target: ${parts.join(" and ")}.`;
}

export function lineCells(
  from: { row: number; col: number },
  to: { row: number; col: number },
) {
  const dRow = to.row - from.row;
  const dCol = to.col - from.col;
  const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
  if (steps === 0) return [from];
  const cells: { row: number; col: number }[] = [];
  for (let step = 0; step <= steps; step += 1) {
    cells.push({
      row: from.row + Math.round((dRow * step) / steps),
      col: from.col + Math.round((dCol * step) / steps),
    });
  }
  return cells;
}
