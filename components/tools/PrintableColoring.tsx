"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColoringCanvas,
  findColoringCanvas,
} from "@/components/tools/ColoringCanvas";
import {
  coloringCategories,
  coloringPages,
  type ColoringCategory,
  type ColoringPage,
} from "@/lib/coloring-pages";

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

type SessionPage = ColoringPage & { generated?: boolean };

export function PrintableColoring() {
  const [category, setCategory] = useState<ColoringCategory>("animals");
  const [pageId, setPageId] = useState(coloringPages[0].id);
  const [color, setColor] = useState(PALETTE[0]);
  const [revision, setRevision] = useState(0);
  const [generated, setGenerated] = useState<SessionPage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [imagineReady, setImagineReady] = useState<boolean | null>(null);
  const [printSrc, setPrintSrc] = useState<string | null>(null);
  const artRef = useRef<HTMLDivElement>(null);

  const pages = useMemo((): SessionPage[] => {
    const extras = generated.filter((page) => page.category === category);
    return [
      ...coloringPages.filter((page) => page.category === category),
      ...extras,
    ];
  }, [category, generated]);

  const page = pages.find((item) => item.id === pageId) ?? pages[0];

  const selectCategory = (next: ColoringCategory) => {
    setCategory(next);
    const first =
      coloringPages.find((item) => item.category === next) ??
      generated.find((item) => item.category === next);
    if (first) {
      setPageId(first.id);
      setRevision((value) => value + 1);
    }
  };

  const snapshotCanvas = () => {
    const canvas = findColoringCanvas(artRef.current);
    return canvas?.toDataURL("image/png") ?? page.src;
  };

  const printPage = () => {
    setPrintSrc(snapshotCanvas());
    window.setTimeout(() => window.print(), 50);
  };

  const downloadPng = () => {
    const canvas = findColoringCanvas(artRef.current);
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${page.id}-coloring.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const generatePage = async () => {
    if (generating) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const response = await fetch("/api/coloring/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const payload = (await response.json()) as {
        error?: string;
        id?: string;
        title?: string;
        category?: ColoringCategory;
        image?: string;
      };
      if (!response.ok || !payload.image || !payload.id) {
        throw new Error(payload.error || "Could not generate a page.");
      }
      const next: SessionPage = {
        id: payload.id,
        title: payload.title || "New page",
        category: payload.category || category,
        src: payload.image,
        prompt: "",
        temporary: false,
        generated: true,
      };
      setGenerated((prev) => [next, ...prev]);
      setPageId(next.id);
      setRevision((value) => value + 1);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Generate failed.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/coloring/generate")
      .then((res) => res.json())
      .then((data: { available?: boolean }) => {
        if (!cancelled) setImagineReady(Boolean(data.available));
      })
      .catch(() => {
        if (!cancelled) setImagineReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="no-print rounded-2xl border-2 border-line bg-surface p-4 snap-shadow sm:p-6">
        <h2 className="font-display text-2xl text-ink">Coloring book pages</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Black-and-white line art — animals, mandalas, fantasy, and nature. Tap
          a color, then tap a region. Print or download the page. No licensed TV
          or cartoon characters.
        </p>
        {page.temporary ? (
          <p className="mt-2 text-xs text-ink-muted">
            Starter pages are temporary stand-ins. Run{" "}
            <code className="rounded bg-bg px-1">npm run generate:coloring</code>{" "}
            with <code className="rounded bg-bg px-1">XAI_API_KEY</code> to
            replace them with Grok Imagine art.
          </p>
        ) : null}

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
                setRevision((value) => value + 1);
              }}
              className={`min-h-11 rounded-xl border-2 px-3 text-sm font-medium ${
                page.id === item.id
                  ? "border-accent bg-accent-soft text-ink"
                  : "border-line bg-bg text-ink hover:border-accent/40"
              }`}
            >
              {item.title}
              {item.generated ? (
                <span className="mt-0.5 block text-[11px] font-normal text-ink-muted">
                  Generated
                </span>
              ) : null}
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
          className="mt-5 overflow-hidden rounded-2xl border-2 border-line bg-white p-3 text-ink"
        >
          <ColoringCanvas
            src={page.src}
            color={color}
            revision={revision}
          />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={printPage}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
          >
            Print page
          </button>
          <button
            type="button"
            onClick={downloadPng}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-secondary px-4 text-sm font-semibold text-secondary"
          >
            Download PNG
          </button>
          <button
            type="button"
            onClick={() => setRevision((value) => value + 1)}
            className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            Clear color
          </button>
          <button
            type="button"
            onClick={() => void generatePage()}
            disabled={generating || imagineReady === false}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-line px-4 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate new page"}
          </button>
        </div>
        {imagineReady === false ? (
          <p className="mt-2 text-sm text-ink-muted">
            Generate new page needs a server-side{" "}
            <code className="rounded bg-bg px-1">XAI_API_KEY</code>. Starter
            pages still work.
          </p>
        ) : null}
        {generateError ? (
          <p className="mt-2 text-sm font-medium text-bad">{generateError}</p>
        ) : null}
      </div>

      <div className="mt-6 hidden print-only">
        <h2 className="mb-3 font-display text-2xl">{page.title}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={printSrc ?? page.src}
          alt={page.title}
          className="mx-auto max-h-[10in] w-full object-contain"
        />
      </div>
    </div>
  );
}
