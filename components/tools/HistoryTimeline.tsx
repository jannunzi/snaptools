"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { historySeedEvents } from "@/lib/history-seed";
import {
  DEFAULT_CENTER_YEAR,
  DEFAULT_LANES,
  DEFAULT_ZOOM,
  ERA_PRESETS,
  formatYear,
  formatYearRange,
  getCategory,
  GRANULARITY,
  historyCategories,
  isHistoryCategory,
  NOW_YEAR,
  shouldShowEvent,
  ticksForRange,
  timelineWidth,
  TIMELINE_END,
  TIMELINE_START,
  type HistoryCategoryId,
  type HistoryEvent,
  type HistoryGranularity,
  windowKey,
  windowsOverlapping,
  xToYear,
  yearToX,
  ZOOM_LEVELS,
} from "@/lib/history-timeline";

const TOOL_SLUG = "history-timeline";
const LANE_HEIGHT = 156;
const AXIS_HEIGHT = 44;
const CARD_WIDTH = 172;
const DEBOUNCE_MS = 280;
const OVERSCAN_PX = 360;

type Lane = { id: string; category: HistoryCategoryId };

type EventsResponse = {
  events?: HistoryEvent[];
  windows?: Array<{
    start: number;
    end: number;
    key: string;
    source: "cache" | "generated" | "seed" | "missing";
  }>;
  meta?: {
    mongo?: boolean;
    xai?: boolean;
    generated?: number;
    cached?: number;
    pending?: number;
  };
  error?: string;
};

function debounce<T extends (...args: never[]) => void>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return wrapped;
}

function packEvents(
  events: HistoryEvent[],
  pixelsPerYear: number,
  maxRows = 3,
) {
  const rowEnds: number[] = [];
  const packed: { event: HistoryEvent; x: number; row: number }[] = [];
  const sorted = [...events].sort((a, b) => a.year - b.year);

  for (const event of sorted) {
    const x = yearToX(event.year, pixelsPerYear);
    let row = rowEnds.findIndex((end) => x >= end + 10);
    if (row === -1) {
      if (rowEnds.length >= maxRows) {
        row = rowEnds.length - 1;
      } else {
        row = rowEnds.length;
        rowEnds.push(0);
      }
    }
    rowEnds[row] = x + CARD_WIDTH;
    packed.push({ event, x, row });
  }
  return packed;
}

function accentClass(accent: string) {
  if (accent === "secondary") return "bg-secondary";
  if (accent === "bad") return "bg-bad";
  if (accent === "ok") return "bg-ok";
  if (accent === "muted") return "bg-ink-muted";
  return "bg-ink";
}

export function HistoryTimeline() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const centerYearRef = useRef(DEFAULT_CENTER_YEAR);
  const loadedRef = useRef(new Set<string>());
  const inflightRef = useRef(new Set<string>());
  const didCenter = useRef(false);

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [lanes, setLanes] = useState<Lane[]>(() =>
    DEFAULT_LANES.map((category, index) => ({
      id: `lane-${index}`,
      category,
    })),
  );
  const [eventsById, setEventsById] = useState<Record<string, HistoryEvent>>(
    () => Object.fromEntries(historySeedEvents.map((event) => [event.id, event])),
  );
  const [loadingKeys, setLoadingKeys] = useState<string[]>([]);
  const [viewport, setViewport] = useState({ left: 0, width: 720 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    mongo: boolean | null;
    xai: boolean | null;
    note: string;
  }>({ mongo: null, xai: null, note: "Seeded events are ready." });

  const zoomSpec = ZOOM_LEVELS[zoom] ?? ZOOM_LEVELS[DEFAULT_ZOOM];
  const granularity = zoomSpec.granularity;
  const pixelsPerYear = zoomSpec.pixelsPerYear;
  const width = timelineWidth(pixelsPerYear);

  const visible = useMemo(() => {
    const pad = OVERSCAN_PX / pixelsPerYear;
    const start = xToYear(viewport.left, pixelsPerYear) - pad;
    const end = xToYear(viewport.left + viewport.width, pixelsPerYear) + pad;
    return {
      start: Math.max(TIMELINE_START, start),
      end: Math.min(TIMELINE_END, end),
    };
  }, [pixelsPerYear, viewport.left, viewport.width]);

  const ticks = useMemo(
    () =>
      ticksForRange(
        visible.start,
        visible.end,
        zoomSpec.tick,
        zoomSpec.labelEvery,
      ),
    [visible.end, visible.start, zoomSpec.labelEvery, zoomSpec.tick],
  );

  const readViewport = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const left = node.scrollLeft;
    const viewWidth = node.clientWidth || 720;
    centerYearRef.current = xToYear(left + viewWidth / 2, pixelsPerYear);
    setViewport({ left, width: viewWidth });
  }, [pixelsPerYear]);

  const scrollToYear = useCallback(
    (year: number, behavior: ScrollBehavior = "smooth") => {
      const node = scrollerRef.current;
      if (!node) return;
      const left = yearToX(year, pixelsPerYear) - node.clientWidth / 2;
      node.scrollTo({ left: Math.max(0, left), behavior });
    },
    [pixelsPerYear],
  );

  const applyZoom = useCallback((nextLevel: number) => {
    const clamped = Math.min(ZOOM_LEVELS.length - 1, Math.max(0, nextLevel));
    setZoom((prev) => {
      if (prev === clamped) return prev;
      trackEvent(analyticsEvents.zoom, {
        tool: TOOL_SLUG,
        granularity: ZOOM_LEVELS[clamped].granularity,
        count: clamped,
      });
      return clamped;
    });
  }, []);

  const fetchRange = useCallback(
    async (
      categories: HistoryCategoryId[],
      start: number,
      end: number,
      gran: HistoryGranularity,
      fill: boolean,
    ) => {
      const unique = [...new Set(categories)];
      await Promise.all(
        unique.map(async (category) => {
          const windows = windowsOverlapping(start, end, gran);
          const needed = windows.filter((window) => {
            const key = windowKey(category, gran, window.start);
            return !loadedRef.current.has(key) && !inflightRef.current.has(key);
          });
          if (needed.length === 0) return;

          const keys = needed.map((window) =>
            windowKey(category, gran, window.start),
          );
          keys.forEach((key) => inflightRef.current.add(key));
          setLoadingKeys((prev) => [...new Set([...prev, ...keys])]);

          try {
            const response = await fetch("/api/history-timeline/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category,
                start: needed[0].start,
                end: needed[needed.length - 1].end,
                granularity: gran,
                fill,
              }),
            });
            const payload = (await response.json()) as EventsResponse;
            if (payload.meta) {
              setStatus({
                mongo: payload.meta.mongo ?? null,
                xai: payload.meta.xai ?? null,
                note:
                  payload.meta.generated && payload.meta.generated > 0
                    ? `Filled ${payload.meta.generated} missing window${payload.meta.generated === 1 ? "" : "s"} with Grok.`
                    : payload.error
                      ? payload.error
                      : "Showing cached and seeded events.",
              });
            }
            if (payload.events) {
              setEventsById((prev) => {
                const next = { ...prev };
                for (const event of payload.events ?? []) next[event.id] = event;
                return next;
              });
            }
            for (const window of payload.windows ?? []) {
              if (window.source !== "missing") {
                loadedRef.current.add(window.key);
              }
            }
            if (fill) {
              trackEvent(analyticsEvents.panFetch, {
                tool: TOOL_SLUG,
                category,
                granularity: gran,
                count: payload.events?.length ?? 0,
              });
            }
            if (
              fill &&
              payload.meta?.xai &&
              (payload.meta.pending ?? 0) > 0
            ) {
              window.setTimeout(() => {
                void fetchRange([category], start, end, gran, true);
              }, 500);
            }
          } catch {
            setStatus((prev) => ({
              ...prev,
              note: "Could not reach the timeline cache. Seeded events still show.",
            }));
          } finally {
            keys.forEach((key) => inflightRef.current.delete(key));
            setLoadingKeys((prev) => prev.filter((key) => !keys.includes(key)));
          }
        }),
      );
    },
    [],
  );

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const onScroll = debounce(() => readViewport(), DEBOUNCE_MS);
    node.addEventListener("scroll", onScroll, { passive: true });
    const onResize = debounce(() => readViewport(), DEBOUNCE_MS);
    window.addEventListener("resize", onResize);
    return () => {
      onScroll.cancel();
      onResize.cancel();
      node.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [readViewport]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const year = didCenter.current
      ? centerYearRef.current
      : DEFAULT_CENTER_YEAR;
    didCenter.current = true;
    const left = yearToX(year, pixelsPerYear) - node.clientWidth / 2;
    node.scrollLeft = Math.max(0, left);
    centerYearRef.current = year;
    readViewport();
  }, [pixelsPerYear, readViewport]);

  useEffect(() => {
    const categories = lanes.map((lane) => lane.category);
    const timer = window.setTimeout(() => {
      void fetchRange(categories, visible.start, visible.end, granularity, true);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [fetchRange, granularity, lanes, visible.end, visible.start]);

  useEffect(() => {
    void fetch("/api/history-timeline/events?status=1")
      .then((response) => response.json())
      .then((payload: { mongo?: boolean; xai?: boolean }) => {
        setStatus((prev) => ({
          ...prev,
          mongo: payload.mongo ?? null,
          xai: payload.xai ?? null,
        }));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollerRef.current?.scrollBy({ left: 240, behavior: "smooth" });
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollerRef.current?.scrollBy({ left: -240, behavior: "smooth" });
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        applyZoom(zoom + 1);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        applyZoom(zoom - 1);
      } else if (event.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyZoom, zoom]);

  const swapLane = (laneId: string, category: HistoryCategoryId) => {
    setLanes((prev) =>
      prev.map((lane) => (lane.id === laneId ? { ...lane, category } : lane)),
    );
    setSelectedId(null);
    trackEvent(analyticsEvents.categorySwap, {
      tool: TOOL_SLUG,
      category,
      granularity,
    });
  };

  const jumpEra = (preset: (typeof ERA_PRESETS)[number]) => {
    centerYearRef.current = (preset.start + preset.end) / 2;
    applyZoom(preset.zoom);
    window.setTimeout(() => scrollToYear(centerYearRef.current), 30);
  };

  const allEvents = useMemo(() => Object.values(eventsById), [eventsById]);
  const selected = selectedId ? eventsById[selectedId] : undefined;
  const loadingSet = useMemo(() => new Set(loadingKeys), [loadingKeys]);

  return (
    <div className="snap-panel overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="snap-btn min-h-11 min-w-11 px-0"
              aria-label="Zoom out"
              disabled={zoom <= 0}
              onClick={() => applyZoom(zoom - 1)}
            >
              −
            </button>
            <button
              type="button"
              className="snap-btn min-h-11 min-w-11 px-0"
              aria-label="Zoom in"
              disabled={zoom >= ZOOM_LEVELS.length - 1}
              onClick={() => applyZoom(zoom + 1)}
            >
              +
            </button>
          </div>
          <p className="text-sm font-semibold text-ink">
            {GRANULARITY[granularity].label}
            <span className="mx-2 font-normal text-ink-muted">·</span>
            <span className="font-normal text-ink-muted">
              {formatYearRange(Math.round(visible.start), Math.round(visible.end))}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Jump to an era">
          {ERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => jumpEra(preset)}
              className="min-h-10 rounded-full border border-line bg-bg px-3 text-sm font-medium text-ink hover:border-accent/50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        <div className="w-[7.75rem] shrink-0 border-r border-line sm:w-[9.25rem]">
          <div style={{ height: AXIS_HEIGHT }} className="bg-surface-muted/70" />
          {lanes.map((lane) => {
            const meta = getCategory(lane.category);
            return (
              <div
                key={lane.id}
                className="flex flex-col justify-center gap-1.5 border-t border-line px-2.5 sm:px-3"
                style={{ height: LANE_HEIGHT }}
              >
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  Lane
                  <span className="sr-only"> category</span>
                </label>
                <select
                  className="snap-input min-h-10 px-2 text-sm font-semibold"
                  value={lane.category}
                  aria-label={`${meta.label} lane category`}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (isHistoryCategory(value)) swapLane(lane.id, value);
                  }}
                >
                  {historyCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <p className="hidden text-[11px] leading-snug text-ink-muted sm:block">
                  {meta.hint}
                </p>
              </div>
            );
          })}
        </div>

        <div
          ref={scrollerRef}
          className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain"
          aria-label="History timeline, past on the left, future on the right"
        >
          <div className="relative" style={{ width }}>
            <div
              className="sticky top-0 z-10 border-b border-line bg-surface-muted/90 backdrop-blur-md"
              style={{ height: AXIS_HEIGHT }}
            >
              {ticks.map((tick) => (
                <div
                  key={tick.year}
                  className="absolute top-0 h-full"
                  style={{ left: yearToX(tick.year, pixelsPerYear) }}
                >
                  <div
                    className={`w-px ${tick.label ? "h-3 bg-ink/40" : "h-2 bg-line"}`}
                  />
                  {tick.label ? (
                    <p className="absolute top-3 -translate-x-1/2 whitespace-nowrap text-[11px] tabular-nums text-ink-muted">
                      {formatYear(tick.year)}
                    </p>
                  ) : null}
                </div>
              ))}
              <div
                className="absolute top-0 h-full w-px bg-secondary"
                style={{ left: yearToX(NOW_YEAR, pixelsPerYear) }}
                title="Now"
              >
                <span className="absolute top-3 left-1.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                  Now
                </span>
              </div>
            </div>

            {lanes.map((lane) => (
              <LaneRow
                key={lane.id}
                category={lane.category}
                events={allEvents}
                granularity={granularity}
                pixelsPerYear={pixelsPerYear}
                visibleStart={visible.start}
                visibleEnd={visible.end}
                loadingKeys={loadingSet}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <p className="text-xs leading-relaxed text-ink-muted">
          Left is the past, right is the future. Empty stretches fill as you
          pan
          {status.xai === false
            ? " — add XAI_API_KEY on the server to generate missing spans"
            : " with Grok"}
          {status.mongo === false
            ? ". MongoDB is not configured, so new fills are not cached."
            : status.mongo
              ? " and are cached in MongoDB."
              : "."}{" "}
          {status.note}
        </p>
        <p className="shrink-0 text-xs text-ink-muted">
          Arrow keys pan · +/− zoom
        </p>
      </div>

      {selected ? (
        <aside className="border-t border-line bg-secondary-soft/50 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {getCategory(selected.category).label}
              <span className="mx-2 text-line">·</span>
              {formatYearRange(selected.year, selected.endYear ?? selected.year)}
              {selected.projected ? (
                <>
                  <span className="mx-2 text-line">·</span>
                  Projected
                </>
              ) : null}
            </p>
            <button
              type="button"
              className="text-sm font-medium text-ink-muted hover:text-ink"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>
          <h3 className="mt-1 font-display text-xl text-ink">{selected.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            {selected.summary}
          </p>
          <p className="mt-3 text-xs text-ink-muted">
            {selected.source === "ai" ? "Generated by Grok and cached" : "Seeded bootstrap"}
          </p>
        </aside>
      ) : null}
    </div>
  );
}

function LaneRow({
  category,
  events,
  granularity,
  pixelsPerYear,
  visibleStart,
  visibleEnd,
  loadingKeys,
  selectedId,
  onSelect,
}: {
  category: HistoryCategoryId;
  events: HistoryEvent[];
  granularity: HistoryGranularity;
  pixelsPerYear: number;
  visibleStart: number;
  visibleEnd: number;
  loadingKeys: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const meta = getCategory(category);
  const visibleEvents = events.filter(
    (event) =>
      event.category === category &&
      shouldShowEvent(event, granularity) &&
      event.year < visibleEnd + 40 &&
      (event.endYear ?? event.year) > visibleStart - 40,
  );
  const packed = packEvents(visibleEvents, pixelsPerYear);
  const windows = windowsOverlapping(visibleStart, visibleEnd, granularity);
  const pending = windows.filter((window) =>
    loadingKeys.has(windowKey(category, granularity, window.start)),
  );

  return (
    <div
      className="relative border-t border-line"
      style={{ height: LANE_HEIGHT }}
      role="list"
      aria-label={`${meta.label} events`}
    >
      {pending.map((window) => (
        <div
          key={`load-${window.start}`}
          className="absolute top-3 bottom-3 animate-pulse rounded-xl bg-secondary-soft/70"
          style={{
            left: yearToX(window.start, pixelsPerYear),
            width: Math.max(
              48,
              (window.end - window.start) * pixelsPerYear - 8,
            ),
          }}
          aria-hidden
        />
      ))}
      {packed.map(({ event, x, row }) => {
        const selected = event.id === selectedId;
        const span =
          event.endYear && event.endYear > event.year
            ? (event.endYear - event.year) * pixelsPerYear
            : 0;
        return (
          <div key={event.id} role="listitem">
            {span > CARD_WIDTH / 2 ? (
              <div
                className="absolute top-[1.35rem] h-px bg-line"
                style={{ left: x + 12, width: span }}
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              onClick={() => onSelect(event.id)}
              aria-pressed={selected}
              className={`absolute w-[10.5rem] rounded-xl border px-2.5 py-1.5 text-left transition-colors ${
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface hover:border-accent/40"
              }`}
              style={{ left: x, top: 10 + row * 46 }}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${accentClass(meta.accent)}`}
                  aria-hidden
                />
                <span className="text-[11px] tabular-nums text-ink-muted">
                  {formatYear(event.year)}
                </span>
                {event.projected ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary">
                    Proj.
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
                {event.title}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
