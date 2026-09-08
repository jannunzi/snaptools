"use client";

import { useMemo, useRef, useState } from "react";
import {
  coloringCategories,
  coloringPages,
  type ColoringCategory,
  type ColoringPage,
} from "@/lib/coloring-pages";

const PALETTE = [
  "#e31c00",
  "#ff7a00",
  "#ffd400",
  "#7ad100",
  "#008a45",
  "#00c2b0",
  "#0077ff",
  "#6b4cff",
  "#ff4da6",
  "#8b5a2b",
  "#111111",
  "#ffffff",
];

function pageSvgMarkup(page: ColoringPage, fills: Record<string, string>) {
  const regions = page.regions
    .map((region) => {
      const fill = fills[region.id] || "#ffffff";
      return `<path d="${region.d}" fill="${fill}" stroke="#111111" stroke-width="2.4" stroke-linejoin="round" />`;
    })
    .join("");
  const strokes = (page.strokes ?? [])
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="#111111" stroke-width="2.2" stroke-linecap="round" />`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${page.viewBox}">${regions}${strokes}</svg>`;
}

export function PrintableColoring() {
  const [category, setCategory] = useState<ColoringCategory | "all">("all");
  const [pageId, setPageId] = useState(coloringPages[0].id);
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const svgRef = useRef<SVGSVGElement>(null);

  const pages = useMemo(
    () =>
      category === "all"
        ? coloringPages
        : coloringPages.filter((page) => page.category === category),
    [category],
  );

  const page = pages.find((item) => item.id === pageId) ?? pages[0] ?? coloringPages[0];

  const choosePage = (next: ColoringPage) => {
    setPageId(next.id);
    setFills({});
  };

  const fillRegion = (id: string) => {
    setFills((prev) => ({ ...prev, [id]: color }));
  };

  const downloadSvg = () => {
    const blob = new Blob([pageSvgMarkup(page, fills)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${page.id}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printPage = () => {
    window.print();
  };

  return (
    <div>
      <div className="no-print rounded-2xl border-2 border-line bg-surface p-4 snap-shadow sm:p-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`min-h-10 rounded-full px-3 text-sm font-bold ${
              category === "all"
                ? "bg-accent text-accent-ink"
                : "border-2 border-line bg-bg text-ink hover:border-accent"
            }`}
          >
            All
          </button>
          {coloringCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCategory(item.id);
                const first = coloringPages.find((page) => page.category === item.id);
                if (first && first.category !== page.category) {
                  choosePage(first);
                }
              }}
              className={`min-h-10 rounded-full px-3 text-sm font-bold ${
                category === item.id
                  ? "bg-accent text-accent-ink"
                  : "border-2 border-line bg-bg text-ink hover:border-accent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {pages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => choosePage(item)}
              className={`rounded-xl border-2 p-3 text-left ${
                page.id === item.id
                  ? "border-secondary bg-secondary-soft"
                  : "border-line bg-bg hover:border-accent/60"
              }`}
            >
              <span className="block text-xs font-bold uppercase tracking-wide text-secondary-strong">
                {coloringCategories.find((cat) => cat.id === item.category)?.label}
              </span>
              <span className="mt-1 block font-bold text-ink">{item.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold text-ink">Palette</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Color ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => setColor(swatch)}
                className="size-10 rounded-full border-2"
                style={{
                  background: swatch,
                  borderColor: color === swatch ? "var(--ink)" : "var(--line)",
                  boxShadow: color === swatch ? "0 0 0 3px var(--secondary)" : undefined,
                }}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Tap a shape to fill it. White is the eraser.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={printPage}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-ink hover:brightness-110"
          >
            Print page
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-ink hover:brightness-105"
          >
            Download SVG
          </button>
          <button
            type="button"
            onClick={() => setFills({})}
            className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            Clear fills
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border-2 border-line bg-white p-3 print:border-0 print:p-0">
        <h2 className="no-print mb-2 font-display text-xl text-ink">{page.title}</h2>
        <svg
          ref={svgRef}
          viewBox={page.viewBox}
          role="img"
          aria-label={`${page.title} coloring page. Tap a region to fill it.`}
          className="mx-auto block h-auto w-full max-w-xl"
        >
          {page.regions.map((region) => (
            <path
              key={region.id}
              d={region.d}
              fill={fills[region.id] || "#ffffff"}
              stroke="#111111"
              strokeWidth="2.4"
              strokeLinejoin="round"
              className="cursor-pointer"
              onClick={() => fillRegion(region.id)}
            >
              <title>{region.label}</title>
            </path>
          ))}
          {(page.strokes ?? []).map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="#111111"
              strokeWidth="2.2"
              strokeLinecap="round"
              pointerEvents="none"
            />
          ))}
        </svg>
        <p className="print-only mt-3 hidden text-center text-sm">
          SnapTools — original line art. Color, print, or share.
        </p>
      </div>
    </div>
  );
}
