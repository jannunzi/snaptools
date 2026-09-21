"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MathLabFrame, useMathLabProjector } from "@/components/labs/MathLabFrame";
import {
  AREA_PRESETS,
  DEFAULT_GRID,
  EXPLORE_RECT,
  GRID_SIZES,
  TARGET_START,
  areaChoices,
  areaVerdict,
  boundingRect,
  cellsFromRect,
  cellsInside,
  clampRect,
  describeExplore,
  describeSameArea,
  describeSamePerimeter,
  describeTarget,
  factorPairs,
  isSolidRectangle,
  key,
  lineCells,
  measure,
  mostSquarePair,
  perimeterChoices,
  perimeterVerdict,
  placeRect,
  rectangleArea,
  rectanglePerimeter,
  rectanglePhrase,
  resizeRect,
  sameAreaPrompt,
  samePerimeterPrompt,
  sizePhrase,
  stepAreaPair,
  stepPerimeterPair,
  targetChoices,
  targetVerdict,
  type Pair,
  type Rect,
  type Side,
  type TargetSpec,
  type Verdict,
} from "@/lib/area-perimeter";

type Mode = "explore" | "same-perimeter" | "same-area" | "target";
type Build = "rectangle" | "paint";
type Tone = "live" | "example";

type Board = {
  build: Build;
  rect: Rect;
  cells: string[];
};

const MODES: { id: Mode; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "same-perimeter", label: "Same perimeter" },
  { id: "same-area", label: "Same area" },
  { id: "target", label: "Target" },
];

function pillClass(active: boolean) {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-3.5 text-sm font-semibold ${
    active
      ? "border-ink bg-accent text-accent-ink"
      : "border-line bg-surface text-ink hover:border-ink"
  }`;
}

function boardCells(board: Board) {
  return board.build === "rectangle" ? cellsFromRect(board.rect) : board.cells;
}

function rectangleBoard(grid: number, width: number, height: number): Board {
  return {
    build: "rectangle",
    rect: placeRect(grid, grid, width, height),
    cells: [],
  };
}

function exploreBoard(grid: number): Board {
  return rectangleBoard(grid, EXPLORE_RECT.width, EXPLORE_RECT.height);
}

function verdictClass(verdict: Verdict) {
  if (verdict === "better" || verdict === "match" || verdict === "different") return "text-ok";
  return "text-ink";
}

function cellShadows(filled: boolean, sides: Side[] | undefined, tone: Tone) {
  const perimeter = tone === "live" ? "var(--secondary)" : "var(--ink)";
  const hair = filled
    ? tone === "live"
      ? "color-mix(in srgb, var(--accent-ink) 32%, var(--accent))"
      : "var(--line)"
    : "var(--line)";
  const shadows = [`inset 0 0 0 1px ${hair}`];
  if (filled && sides) {
    const thickness = 6;
    if (sides.includes("top")) shadows.push(`inset 0 ${thickness}px 0 ${perimeter}`);
    if (sides.includes("bottom")) shadows.push(`inset 0 -${thickness}px 0 ${perimeter}`);
    if (sides.includes("left")) shadows.push(`inset ${thickness}px 0 0 ${perimeter}`);
    if (sides.includes("right")) shadows.push(`inset -${thickness}px 0 0 ${perimeter}`);
  }
  return shadows.join(", ");
}

function cellAt(
  clientX: number,
  clientY: number,
  rows: number,
  cols: number,
  node: HTMLElement,
) {
  const bounds = node.getBoundingClientRect();
  const x = clientX - bounds.left;
  const y = clientY - bounds.top;
  if (x < 0 || y < 0 || x >= bounds.width || y >= bounds.height) return null;
  return {
    row: Math.min(rows - 1, Math.max(0, Math.floor((y / bounds.height) * rows))),
    col: Math.min(cols - 1, Math.max(0, Math.floor((x / bounds.width) * cols))),
  };
}

function TileGrid({
  rows,
  cols,
  cells,
  tone,
  label,
  interactive,
  build,
  rect,
  onToggle,
  onPaintCells,
  onResize,
}: {
  rows: number;
  cols: number;
  cells: readonly string[];
  tone: Tone;
  label: string;
  interactive: boolean;
  build: Build;
  rect: Rect | null;
  onToggle?: (row: number, col: number) => void;
  onPaintCells?: (spots: { row: number; col: number }[], fill: boolean) => void;
  onResize?: (width: number, height: number) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const paintRef = useRef<{ fill: boolean; last: { row: number; col: number } } | null>(null);
  const dragRef = useRef<{
    which: "right" | "bottom" | "corner";
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const pointerPainted = useRef(false);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const measured = useMemo(() => measure(cells), [cells]);
  const filled = useMemo(() => new Set(cells), [cells]);
  const painting = interactive && build === "paint";
  const showHandles =
    interactive && build === "rectangle" && rect !== null && rect.width > 0 && rect.height > 0;
  const cursorRow = Math.min(cursor.row, rows - 1);
  const cursorCol = Math.min(cursor.col, cols - 1);

  const paintAt = (spot: { row: number; col: number }, fill: boolean) => {
    const last = paintRef.current?.last;
    const spots = last ? lineCells(last, spot) : [spot];
    paintRef.current = { fill, last: spot };
    onPaintCells?.(spots, fill);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = gridRef.current;
    if (!node) return;
    const handle = (event.target as Element).closest("[data-handle]");
    if (handle instanceof HTMLElement && rect) {
      const which = handle.dataset.handle;
      if (which !== "right" && which !== "bottom" && which !== "corner") return;
      event.preventDefault();
      node.setPointerCapture(event.pointerId);
      dragRef.current = {
        which,
        x: event.clientX,
        y: event.clientY,
        width: rect.width,
        height: rect.height,
      };
      return;
    }
    if (!painting) return;
    const spot = cellAt(event.clientX, event.clientY, rows, cols, node);
    if (!spot) return;
    event.preventDefault();
    node.setPointerCapture(event.pointerId);
    pointerPainted.current = true;
    paintRef.current = null;
    setCursor(spot);
    paintAt(spot, !filled.has(key(spot.row, spot.col)));
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = gridRef.current;
    if (!node) return;
    if (paintRef.current && painting) {
      const spot = cellAt(event.clientX, event.clientY, rows, cols, node);
      if (!spot) return;
      const last = paintRef.current.last;
      if (last.row === spot.row && last.col === spot.col) return;
      paintAt(spot, paintRef.current.fill);
      return;
    }
    const drag = dragRef.current;
    if (!drag || !onResize) return;
    const bounds = node.getBoundingClientRect();
    const dCol = Math.round((event.clientX - drag.x) / (bounds.width / cols));
    const dRow = Math.round((event.clientY - drag.y) / (bounds.height / rows));
    onResize(
      drag.which === "bottom" ? drag.width : drag.width + dCol,
      drag.which === "right" ? drag.height : drag.height + dRow,
    );
  };

  const endPointer = () => {
    paintRef.current = null;
    dragRef.current = null;
    window.setTimeout(() => {
      pointerPainted.current = false;
    }, 0);
  };

  const onHandleKey = (
    which: "right" | "bottom" | "corner",
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (!rect || !onResize) return;
    let width = rect.width;
    let height = rect.height;
    let changed = false;
    if ((event.key === "ArrowRight" || event.key === "ArrowLeft") && which !== "bottom") {
      width += event.key === "ArrowRight" ? 1 : -1;
      changed = true;
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && which !== "right") {
      height += event.key === "ArrowDown" ? 1 : -1;
      changed = true;
    }
    if (!changed) return;
    event.preventDefault();
    onResize(width, height);
  };

  const onGridKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!painting) return;
    const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!arrows.includes(event.key)) return;
    const targetNode = event.target;
    if (!(targetNode instanceof HTMLElement) || !targetNode.closest("[data-area-grid]")) return;
    event.preventDefault();
    let row = cursorRow;
    let col = cursorCol;
    if (event.key === "ArrowRight") col = Math.min(cols - 1, col + 1);
    if (event.key === "ArrowLeft") col = Math.max(0, col - 1);
    if (event.key === "ArrowDown") row = Math.min(rows - 1, row + 1);
    if (event.key === "ArrowUp") row = Math.max(0, row - 1);
    if (event.key === "Home") col = 0;
    if (event.key === "End") col = cols - 1;
    setCursor({ row, col });
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-row="${row}"][data-col="${col}"]`)
      ?.focus();
  };

  const handleStyle = (which: "right" | "bottom" | "corner") => {
    if (!rect) return undefined;
    const x =
      which === "bottom"
        ? ((rect.col + rect.width / 2) / cols) * 100
        : ((rect.col + rect.width) / cols) * 100;
    const y =
      which === "right"
        ? ((rect.row + rect.height / 2) / rows) * 100
        : ((rect.row + rect.height) / rows) * 100;
    return { left: `${x}%`, top: `${y}%` };
  };

  const handleLabel = {
    right: "Drag to change the width. Left and right arrow keys work too.",
    bottom: "Drag to change the height. Up and down arrow keys work too.",
    corner: "Drag to change the width and height. Arrow keys work too.",
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="p-6" style={{ width: `max(100%, ${cols * 2.75}rem)` }}>
        <div
          ref={gridRef}
          data-area-grid
          role={painting ? "grid" : "group"}
          aria-label={label}
          aria-rowcount={painting ? rows : undefined}
          aria-colcount={painting ? cols : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onKeyDown={onGridKeyDown}
          onContextMenu={(event) => event.preventDefault()}
          className="relative aspect-square w-full touch-none select-none"
        >
          <div className="flex h-full w-full flex-col">
            {Array.from({ length: rows }, (_, row) => (
              <div
                key={row}
                role={painting ? "row" : undefined}
                className="flex min-h-0 flex-1"
              >
                {Array.from({ length: cols }, (_, col) => {
                  const id = key(row, col);
                  const on = filled.has(id);
                  const sides = measured.exposed[id];
                  const face = on ? "bg-accent" : "bg-surface";
                  const exampleFace = on ? "bg-accent-soft" : "bg-surface";
                  const style = { boxShadow: cellShadows(on, sides, tone) };
                  if (!painting) {
                    return (
                      <div
                        key={id}
                        aria-hidden="true"
                        className={`min-w-0 flex-1 ${tone === "live" ? face : exampleFace}`}
                        style={style}
                      />
                    );
                  }
                  const isCursor = cursorRow === row && cursorCol === col;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="gridcell"
                      data-row={row}
                      data-col={col}
                      tabIndex={isCursor ? 0 : -1}
                      aria-label={`Row ${row + 1}, column ${col + 1}, ${on ? "filled" : "empty"}`}
                      onClick={() => {
                        if (pointerPainted.current) return;
                        onToggle?.(row, col);
                        setCursor({ row, col });
                      }}
                      className={`min-w-0 flex-1 touch-manipulation ${face}`}
                      style={style}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {showHandles
            ? (["right", "bottom", "corner"] as const).map((which) => (
                <button
                  key={which}
                  type="button"
                  data-handle={which}
                  aria-label={handleLabel[which]}
                  onKeyDown={(event) => onHandleKey(which, event)}
                  className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-surface text-lg font-semibold text-ink shadow ring-2 ring-secondary"
                  style={handleStyle(which)}
                >
                  <span aria-hidden="true">{which === "right" ? "↔" : which === "bottom" ? "↕" : "⤡"}</span>
                </button>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  large,
  name,
}: {
  label: string;
  value: number;
  unit: string;
  large: boolean;
  name: "area" | "perimeter";
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p
        data-stat={name}
        className={`font-display tabular-nums leading-none text-ink ${large ? "text-7xl" : "text-5xl sm:text-6xl"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-ink-muted">{unit}</p>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <span className="w-16 text-sm font-semibold text-ink">{label}</span>
      <button
        type="button"
        className="snap-btn-secondary min-w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-8 text-center font-display text-2xl tabular-nums text-ink">{value}</span>
      <button
        type="button"
        className="snap-btn-secondary min-w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

export function AreaPerimeter() {
  const [grid, setGrid] = useState(DEFAULT_GRID);
  const [mode, setMode] = useState<Mode>("explore");
  const [perimeterId, setPerimeterId] = useState("p16");
  const [areaId, setAreaId] = useState<(typeof AREA_PRESETS)[number]["id"]>("a8");
  const [targetId, setTargetId] = useState("a9-p12");
  const [board, setBoard] = useState<Board>(() => exploreBoard(DEFAULT_GRID));
  const [bestArea, setBestArea] = useState(0);
  const [bestStampSeen, setBestStampSeen] = useState(`explore:p16:${DEFAULT_GRID}`);
  const [snapNote, setSnapNote] = useState("");

  const perimeterOptions = perimeterChoices(grid);
  const areaOptions = areaChoices(grid);
  const targetOptions = targetChoices(grid);
  const perimeterPreset = perimeterOptions.find((item) => item.id === perimeterId) ?? perimeterOptions[0];
  const areaPreset = areaOptions.find((item) => item.id === areaId) ?? areaOptions[0];
  const target = targetOptions.find((item) => item.id === targetId) ?? targetOptions[0];
  const areaExample = areaPreset ? mostSquarePair(areaPreset.area, grid) : null;

  const resetBoard = useCallback(
    (nextMode: Mode, nextGrid: number, nextPerimeterId: string, nextAreaId: string) => {
      if (nextMode === "explore") {
        setBoard(exploreBoard(nextGrid));
        return;
      }
      if (nextMode === "same-perimeter") {
        const preset =
          perimeterChoices(nextGrid).find((item) => item.id === nextPerimeterId) ??
          perimeterChoices(nextGrid)[0];
        if (!preset) return;
        setBoard(rectangleBoard(nextGrid, preset.width, preset.height));
        return;
      }
      if (nextMode === "same-area") {
        const preset =
          areaChoices(nextGrid).find((item) => item.id === nextAreaId) ?? areaChoices(nextGrid)[0];
        const pair = preset ? mostSquarePair(preset.area, nextGrid) : null;
        if (!pair) return;
        setBoard(rectangleBoard(nextGrid, pair.width, pair.height));
        return;
      }
      setBoard(rectangleBoard(nextGrid, TARGET_START.width, TARGET_START.height));
    },
    [],
  );

  const selectMode = (next: Mode) => {
    if (next === mode) return;
    setSnapNote("");
    setMode(next);
    resetBoard(next, grid, perimeterPreset?.id ?? "p16", areaPreset?.id ?? "a8");
  };

  const chooseGrid = (next: number) => {
    if (next === grid) return;
    setSnapNote("");
    setGrid(next);
    if (mode === "explore") {
      setBoard((prev) => ({
        build: prev.build,
        rect: clampRect(prev.rect, next, next),
        cells: cellsInside(prev.cells, next, next),
      }));
      return;
    }
    const nextPerimeter =
      perimeterChoices(next).find((item) => item.id === perimeterId) ?? perimeterChoices(next)[0];
    const nextArea = areaChoices(next).find((item) => item.id === areaId) ?? areaChoices(next)[0];
    const nextTarget = targetChoices(next).find((item) => item.id === targetId) ?? targetChoices(next)[0];
    if (nextPerimeter) setPerimeterId(nextPerimeter.id);
    if (nextArea) setAreaId(nextArea.id);
    if (nextTarget) setTargetId(nextTarget.id);
    resetBoard(mode, next, nextPerimeter?.id ?? perimeterId, nextArea?.id ?? areaId);
  };

  const choosePerimeter = (id: string) => {
    const preset = perimeterOptions.find((item) => item.id === id);
    if (!preset) return;
    setSnapNote("");
    setPerimeterId(preset.id);
    setBoard(rectangleBoard(grid, preset.width, preset.height));
  };

  const chooseArea = (id: string) => {
    const preset = areaOptions.find((item) => item.id === id);
    const pair = preset ? mostSquarePair(preset.area, grid) : null;
    if (!preset || !pair) return;
    setSnapNote("");
    setAreaId(preset.id);
    setBoard(rectangleBoard(grid, pair.width, pair.height));
  };

  const chooseTarget = (id: string) => {
    if (!targetOptions.some((item) => item.id === id)) return;
    setSnapNote("");
    setTargetId(id);
    setBoard(rectangleBoard(grid, TARGET_START.width, TARGET_START.height));
  };

  const cycleExample = () => {
    if (mode === "same-perimeter" && perimeterPreset) {
      const index = perimeterOptions.findIndex((item) => item.id === perimeterPreset.id);
      const next = perimeterOptions[(index + 1) % perimeterOptions.length];
      if (next) choosePerimeter(next.id);
      return;
    }
    if (mode === "same-area" && areaPreset) {
      const index = areaOptions.findIndex((item) => item.id === areaPreset.id);
      const next = areaOptions[(index + 1) % areaOptions.length];
      if (next) chooseArea(next.id);
      return;
    }
    if (mode === "target" && target) {
      const index = targetOptions.findIndex((item) => item.id === target.id);
      const next = targetOptions[(index + 1) % targetOptions.length];
      if (next) chooseTarget(next.id);
    }
  };

  const setBuild = (next: Build) => {
    if (board.build === next) return;
    if (next === "paint") {
      setSnapNote("");
      setBoard({ ...board, build: "paint", cells: cellsFromRect(board.rect) });
      return;
    }
    const solid = board.cells.length === 0 || isSolidRectangle(board.cells);
    setSnapNote(solid || board.cells.length === 0 ? "" : "Snapped to the bounding rectangle. Gaps were filled.");
    const bounds = boundingRect(board.cells);
    setBoard({
      build: "rectangle",
      rect:
        board.cells.length === 0
          ? { row: 0, col: 0, width: 0, height: 0 }
          : clampRect(bounds, grid, grid),
      cells: [],
    });
  };

  const reset = () => {
    setSnapNote("");
    resetBoard(mode, grid, perimeterPreset?.id ?? "p16", areaPreset?.id ?? "a8");
  };

  const resize = (width: number, height: number) => {
    setSnapNote("");
    setBoard((prev) => ({
      ...prev,
      build: "rectangle",
      rect: resizeRect(prev.rect, width, height, grid, grid),
    }));
  };

  const applyPair = (pair: Pair) => {
    setSnapNote("");
    setBoard(rectangleBoard(grid, pair.width, pair.height));
  };

  const paintCells = (spots: { row: number; col: number }[], fill: boolean) => {
    setSnapNote("");
    setBoard((prev) => {
      if (prev.build !== "paint") return prev;
      const next = new Set(prev.cells);
      for (const spot of spots) {
        const id = key(spot.row, spot.col);
        if (fill) next.add(id);
        else next.delete(id);
      }
      return { ...prev, cells: [...next] };
    });
  };

  const toggleCell = (row: number, col: number) => {
    setSnapNote("");
    setBoard((prev) => {
      if (prev.build !== "paint") return prev;
      const id = key(row, col);
      const next = new Set(prev.cells);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, cells: [...next] };
    });
  };

  const cells = useMemo(() => boardCells(board), [board]);
  const measured = useMemo(() => measure(cells), [cells]);
  const solid = board.build === "rectangle" && board.rect.width > 0 ? board.rect : null;
  const shapeNote = solid ? sizePhrase(solid.width, solid.height) : "";

  const examplePair: Pair | null =
    mode === "same-perimeter" && perimeterPreset
      ? { width: perimeterPreset.width, height: perimeterPreset.height }
      : mode === "same-area"
        ? areaExample
        : null;
  const exampleRect = examplePair ? placeRect(grid, grid, examplePair.width, examplePair.height) : null;
  const exampleCells = exampleRect ? cellsFromRect(exampleRect) : [];
  const example = measure(exampleCells);

  const exampleAreaForBest =
    mode === "same-perimeter" && perimeterPreset
      ? rectangleArea(perimeterPreset.width, perimeterPreset.height)
      : 0;
  const bestStamp = `${mode}:${perimeterPreset?.id ?? ""}:${grid}`;
  if (bestStamp !== bestStampSeen) {
    setBestStampSeen(bestStamp);
    setBestArea(exampleAreaForBest);
  } else if (
    mode === "same-perimeter" &&
    perimeterPreset &&
    measured.perimeter === rectanglePerimeter(perimeterPreset.width, perimeterPreset.height) &&
    measured.area > bestArea
  ) {
    setBestArea(measured.area);
  }

  const squareStep =
    mode === "same-perimeter" && board.build === "rectangle"
      ? stepPerimeterPair(board.rect, "square", grid)
      : mode === "same-area" && board.build === "rectangle" && areaPreset
        ? stepAreaPair(board.rect, factorPairs(areaPreset.area, grid), "square")
        : null;
  const barStep =
    mode === "same-perimeter" && board.build === "rectangle"
      ? stepPerimeterPair(board.rect, "bar", grid)
      : mode === "same-area" && board.build === "rectangle" && areaPreset
        ? stepAreaPair(board.rect, factorPairs(areaPreset.area, grid), "bar")
        : null;

  let verdict: Verdict = "pending";
  let sentence = describeExplore(measured.area, measured.perimeter, shapeNote);
  let prompt = "Drag a handle or change the width and height. Area counts the squares. The bright edge is the perimeter.";
  if (mode === "same-perimeter" && perimeterPreset && examplePair) {
    const exampleArea = rectangleArea(examplePair.width, examplePair.height);
    const examplePerimeter = rectanglePerimeter(examplePair.width, examplePair.height);
    verdict = perimeterVerdict(measured.area, measured.perimeter, exampleArea, examplePerimeter);
    sentence = describeSamePerimeter(measured.area, measured.perimeter, exampleArea, examplePerimeter);
    prompt = samePerimeterPrompt(exampleArea, examplePerimeter);
  } else if (mode === "same-area" && areaPreset && examplePair) {
    const exampleArea = areaPreset.area;
    const examplePerimeter = rectanglePerimeter(examplePair.width, examplePair.height);
    verdict = areaVerdict(measured.area, measured.perimeter, exampleArea, examplePerimeter);
    sentence = describeSameArea(measured.area, measured.perimeter, exampleArea, examplePerimeter);
    prompt = sameAreaPrompt(exampleArea, examplePerimeter);
  } else if (mode === "target" && target) {
    verdict = targetVerdict(measured.area, measured.perimeter, target);
    sentence = describeTarget(measured.area, measured.perimeter, target);
    prompt = target.prompt;
  }

  const twoBoards = mode === "same-perimeter" || mode === "same-area";

  return (
    <div data-tool="area-perimeter">
      <MathLabFrame
        label="Area and perimeter tiles"
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
            <div role="group" aria-label="Grid size" className="flex flex-wrap gap-2">
              {GRID_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={pillClass(grid === size)}
                  aria-pressed={grid === size}
                  aria-label={`${size} by ${size} grid`}
                  onClick={() => chooseGrid(size)}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
            <div role="group" aria-label="How to build" className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pillClass(board.build === "rectangle")}
                aria-pressed={board.build === "rectangle"}
                onClick={() => setBuild("rectangle")}
              >
                Rectangle
              </button>
              <button
                type="button"
                className={pillClass(board.build === "paint")}
                aria-pressed={board.build === "paint"}
                onClick={() => setBuild("paint")}
              >
                Paint
              </button>
            </div>
            {mode !== "explore" ? (
              <button type="button" className="snap-btn-secondary" onClick={cycleExample}>
                {mode === "target" ? "New target" : "Next example"}
              </button>
            ) : null}
            <button type="button" className="snap-btn-secondary" onClick={reset}>
              Reset
            </button>
          </>
        }
      >
        <AreaPerimeterStage
          grid={grid}
          mode={mode}
          board={board}
          cells={cells}
          area={measured.area}
          perimeter={measured.perimeter}
          verdict={verdict}
          sentence={sentence}
          prompt={prompt}
          twoBoards={twoBoards}
          exampleRect={exampleRect}
          exampleCells={exampleCells}
          exampleArea={example.area}
          examplePerimeter={example.perimeter}
          exampleLabel={
            examplePair ? rectanglePhrase(examplePair.width, examplePair.height) : ""
          }
          bestArea={bestArea}
          snapNote={snapNote}
          squareStep={squareStep}
          barStep={barStep}
          perimeterOptions={perimeterOptions}
          perimeterId={perimeterPreset?.id ?? ""}
          areaOptions={areaOptions}
          areaId={areaPreset?.id ?? ""}
          targetOptions={targetOptions}
          targetId={target?.id ?? ""}
          onResize={resize}
          onPaintCells={paintCells}
          onToggle={toggleCell}
          onApplyPair={applyPair}
          onPerimeter={choosePerimeter}
          onArea={chooseArea}
          onTarget={chooseTarget}
          onReset={reset}
        />
      </MathLabFrame>
    </div>
  );
}

function AreaPerimeterStage({
  grid,
  mode,
  board,
  cells,
  area,
  perimeter,
  verdict,
  sentence,
  prompt,
  twoBoards,
  exampleRect,
  exampleCells,
  exampleArea,
  examplePerimeter,
  exampleLabel,
  bestArea,
  snapNote,
  squareStep,
  barStep,
  perimeterOptions,
  perimeterId,
  areaOptions,
  areaId,
  targetOptions,
  targetId,
  onResize,
  onPaintCells,
  onToggle,
  onApplyPair,
  onPerimeter,
  onArea,
  onTarget,
  onReset,
}: {
  grid: number;
  mode: Mode;
  board: Board;
  cells: readonly string[];
  area: number;
  perimeter: number;
  verdict: Verdict;
  sentence: string;
  prompt: string;
  twoBoards: boolean;
  exampleRect: Rect | null;
  exampleCells: readonly string[];
  exampleArea: number;
  examplePerimeter: number;
  exampleLabel: string;
  bestArea: number;
  snapNote: string;
  squareStep: Pair | null;
  barStep: Pair | null;
  perimeterOptions: readonly { id: string; width: number; height: number }[];
  perimeterId: string;
  areaOptions: readonly { id: string; area: number }[];
  areaId: string;
  targetOptions: readonly TargetSpec[];
  targetId: string;
  onResize: (width: number, height: number) => void;
  onPaintCells: (spots: { row: number; col: number }[], fill: boolean) => void;
  onToggle: (row: number, col: number) => void;
  onApplyPair: (pair: Pair) => void;
  onPerimeter: (id: string) => void;
  onArea: (id: string) => void;
  onTarget: (id: string) => void;
  onReset: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const hintId = useId();
  const success = verdict === "better" || verdict === "match" || verdict === "different";
  const [seenVerdict, setSeenVerdict] = useState(verdict);
  const [popKey, setPopKey] = useState(0);
  if (seenVerdict !== verdict) {
    const wasSuccess =
      seenVerdict === "better" || seenVerdict === "match" || seenVerdict === "different";
    setSeenVerdict(verdict);
    if (success && !wasSuccess) setPopKey((value) => value + 1);
  }

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (projector) {
        exit();
        return;
      }
      onReset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, onReset, projector]);

  const lesson =
    mode === "same-perimeter"
      ? {
          square: "More square, same perimeter",
          bar: "Longer bar, same perimeter",
        }
      : {
          square: "More square, same area",
          bar: "Longer bar, same area",
        };

  const gridMax = projector ? "max-w-3xl" : "max-w-xl";

  return (
    <div className="no-print">
      <p className="max-w-3xl text-base leading-relaxed text-ink sm:text-lg">{prompt}</p>
      <div
        key={popKey}
        className={`mt-4 flex flex-wrap items-end gap-x-10 gap-y-4 ${
          popKey > 0 ? "animate-pop motion-reduce:animate-none" : ""
        }`}
      >
        <Stat label="Area" value={area} unit={area === 1 ? "square" : "squares"} large={projector} name="area" />
        <Stat
          label="Perimeter"
          value={perimeter}
          unit={perimeter === 1 ? "unit" : "units"}
          large={projector}
          name="perimeter"
        />
      </div>
      <p
        className={`mt-4 max-w-3xl text-base leading-relaxed sm:text-lg ${verdictClass(verdict)}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {sentence}
      </p>
      {mode === "same-perimeter" && bestArea > exampleArea ? (
        <p className="mt-2 text-sm font-semibold text-ok">Largest area so far at this perimeter: {bestArea}</p>
      ) : null}

      {mode === "same-perimeter" ? (
        <div role="group" aria-label="Perimeter examples" className="mt-4 flex flex-wrap gap-2">
          {perimeterOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={pillClass(perimeterId === item.id)}
              aria-pressed={perimeterId === item.id}
              onClick={() => onPerimeter(item.id)}
            >
              Perimeter {rectanglePerimeter(item.width, item.height)}
            </button>
          ))}
        </div>
      ) : null}
      {mode === "same-area" ? (
        <div role="group" aria-label="Area examples" className="mt-4 flex flex-wrap gap-2">
          {areaOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={pillClass(areaId === item.id)}
              aria-pressed={areaId === item.id}
              onClick={() => onArea(item.id)}
            >
              Area {item.area}
            </button>
          ))}
        </div>
      ) : null}
      {mode === "target" ? (
        <div role="group" aria-label="Targets" className="mt-4 flex flex-wrap gap-2">
          {targetOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={pillClass(targetId === item.id)}
              aria-pressed={targetId === item.id}
              onClick={() => onTarget(item.id)}
            >
              {item.area !== undefined ? `A ${item.area}` : "Any area"}
              {item.perimeter !== undefined ? ` · P ${item.perimeter}` : " · any perimeter"}
            </button>
          ))}
        </div>
      ) : null}

      {twoBoards && board.build === "rectangle" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="snap-btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!squareStep}
            onClick={() => squareStep && onApplyPair(squareStep)}
          >
            {lesson.square}
          </button>
          <button
            type="button"
            className="snap-btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!barStep}
            onClick={() => barStep && onApplyPair(barStep)}
          >
            {lesson.bar}
          </button>
        </div>
      ) : null}

      <div className={`mt-5 grid gap-6 ${twoBoards ? "lg:grid-cols-2" : ""}`}>
        {twoBoards && exampleRect ? (
          <figure className="min-w-0">
            <figcaption className="mb-2 text-sm font-semibold text-ink">
              Example · {exampleLabel}
              <span className="ml-2 font-medium text-ink-muted">
                Area {exampleArea} · Perimeter {examplePerimeter}
              </span>
            </figcaption>
            <div className={projector ? "max-w-3xl" : "max-w-xl"}>
              <TileGrid
                rows={grid}
                cols={grid}
                cells={exampleCells}
                tone="example"
                label={`Example ${exampleLabel}, area ${exampleArea}, perimeter ${examplePerimeter}`}
                interactive={false}
                build="rectangle"
                rect={exampleRect}
              />
            </div>
          </figure>
        ) : null}
        <div className="min-w-0">
          {twoBoards ? <p className="mb-2 text-sm font-semibold text-ink">Yours</p> : null}
          <div className={twoBoards ? (projector ? "max-w-3xl" : "max-w-xl") : gridMax}>
            <TileGrid
              rows={grid}
              cols={grid}
              cells={cells}
              tone="live"
              label={`Your shape, area ${area} squares, perimeter ${perimeter} units`}
              interactive
              build={board.build}
              rect={board.rect}
              onToggle={onToggle}
              onPaintCells={onPaintCells}
              onResize={onResize}
            />
          </div>
          {board.build === "rectangle" ? (
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-3">
              <Stepper
                label="Width"
                value={board.rect.width}
                min={1}
                max={grid}
                onChange={(width) => onResize(width, Math.max(1, board.rect.height))}
              />
              <Stepper
                label="Height"
                value={board.rect.height}
                min={1}
                max={grid}
                onChange={(height) => onResize(Math.max(1, board.rect.width), height)}
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">
              Tap a square to paint or erase. Drag to keep going. Switch to Rectangle to snap the outline.
            </p>
          )}
        </div>
      </div>

      {snapNote ? <p className="mt-3 text-sm text-ink-muted">{snapNote}</p> : null}
      <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-muted" aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-7 bg-accent" style={{ boxShadow: "inset 0 0 0 3px var(--secondary)" }} />
          Area, inside
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-7 bg-secondary" />
          Perimeter, around
        </span>
      </p>
      <p id={hintId} className="mt-2 max-w-3xl text-sm text-ink-muted">
        Sides where two squares meet are inside, so they are not part of the perimeter. Escape clears.
        {board.build === "paint" ? " Arrows move between squares. Enter paints or erases." : ""}
      </p>
    </div>
  );
}
