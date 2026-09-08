"use client";

import { useMemo, useRef, useState } from "react";
import {
  coloringCategories,
  coloringPages,
  type ColoringCategory,
} from "@/components/tools/coloring-art";

const PALETTE = [
  "#e31b12",
  "#ffd000",
  "#0b5fff",
  "#ff7a00",
  "#16a34a",
  "#7c3aed",
  "#f472b6",
  "#0f172a",
  "#ffffff",
  "#93c5fd",
  "#86efac",
  "#fde68a",
];

export function PrintableColoring() {
  const [category, setCategory] = useState<ColoringCategory>("animals");
  const [pageId, setPageId] = useState(coloringPages[0].id);
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const artRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(
    () => coloringPages.filter((page) => page.category === category),
    [category],
  );
  const page = coloringPages.find((item) => item.id === pageId) ?? pages[0];

  const selectCategory = (next: ColoringCategory) => {
    setCategory(next);
    const first = coloringPages.find((item) => item.category === next);
    if (first) {
      setPageId(first.id);
      setFills({});
    }
  };

  const colorRegion = (id: string) => {
    setFills((prev) => ({ ...prev, [id]: color }));
  };

  const printPage = () => window.print();

  const downloadSvg = () => {
    const svg = artRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("aria-label", page.title);
    const blob = new Blob(
      [new XMLSerializer().serializeToString(clone)],
      { type: "image/svg+xml;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${page.id}-coloring.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="no-print rounded-2xl border-2 border-line bg-surface p-4 snap-shadow sm:p-6">
        <h2 className="font-display text-2xl text-ink">Original line art</h2>
        <p className="mt-1 text-sm text-ink-muted">
          SnapTools drawings only — animals, mandalas, generic fantasy, and
          nature. No licensed TV or cartoon characters.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {coloringCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => selectCategory(item.id)}
              className={`min-h-10 rounded-full px-3 text-sm font-semibold ${
                category === item.id
                  ? "bg-secondary text-secondary-ink"
                  : "border border-line bg-bg text-ink hover:border-secondary/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {pages.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={page.id === item.id}
              onClick={() => {
                setPageId(item.id);
                setFills({});
              }}
              className={`min-h-11 rounded-xl border-2 px-3 text-sm font-medium ${
                page.id === item.id
                  ? "border-accent bg-accent-soft text-ink"
                  : "border-line bg-bg text-ink hover:border-accent/40"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">Color</p>
          <div className="mt-2 flex flex-wrap gap-2" role="list" aria-label="Color palette">
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use color ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => setColor(swatch)}
                className={`size-10 rounded-full border-2 ${
                  color === swatch ? "border-ink scale-110" : "border-line"
                }`}
                style={{ background: swatch }}
              />
            ))}
          </div>
        </div>

        <div
          ref={artRef}
          className="mt-5 rounded-2xl border-2 border-line bg-white p-3 text-ink"
        >
          {page.render({ fills, onFill: colorRegion })}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={printPage}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
          >
            Print page
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-secondary px-4 text-sm font-semibold text-secondary"
          >
            Download SVG
          </button>
          <button
            type="button"
            onClick={() => setFills({})}
            className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            Clear color
          </button>
        </div>
      </div>

      <div className="mt-6 hidden print-only">
        <h2 className="mb-3 font-display text-2xl">{page.title}</h2>
        <div className="text-ink">{page.render({ fills, onFill: () => undefined })}</div>
      </div>
    </div>
  );
}
