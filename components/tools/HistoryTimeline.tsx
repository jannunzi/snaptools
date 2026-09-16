"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { eventSwatch, hueSwatch, laneBand } from "@/lib/history-colors";
import {
  CUSTOM_HUE_PRESETS,
  defaultHistoryPrefs,
  loadHistoryPrefs,
  MAX_CUSTOM,
  MAX_LANES,
  nextCustomCategoryId,
  nextLaneId,
  saveHistoryPrefs,
  type HistoryLanePref,
} from "@/lib/history-prefs";
import { historySeedEvents, isRetiredHistoryEvent } from "@/lib/history-seed";
import {
  ERA_PRESETS,
  eventBarMetrics,
  eventOverlaps,
  eventSpan,
  formatYearRange,
  getCategory,
  GRANULARITY,
  historyCategories,
  isCustomCategoryId,
  isTimelineCategory,
  laneBandHeight,
  NOW_YEAR,
  pointMinWidth,
  shouldShowEvent,
  subRowsForLanes,
  ticksForRange,
  timelineWidth,
  TIMELINE_END,
  TIMELINE_START,
  type CustomHistoryCategory,
  type HistoryEvent,
  type HistoryGranularity,
  type TimelineCategoryId,
  windowKey,
  windowsOverlapping,
  xToYear,
  yearToX,
  ZOOM_LEVELS,
} from "@/lib/history-timeline";

const TOOL_SLUG = "history-timeline";
const AXIS_HEIGHT = 44;
const ROW_HEIGHT = 48;
const ROW_GAP = 6;
const LANE_PAD = 10;
const PACK_GAP = 8;
const DEBOUNCE_MS = 280;
const OVERSCAN_PX = 360;
const GUTTER_CLASS = "w-[9.5rem] shrink-0 sm:w-[11rem]";
const HEADER_STICKY_TOP = "3.75rem";
const CREATE_NEW = "__create__";

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
    database?: string;
  };
  error?: string;
};

type LaneFillState = {
  status: "idle" | "loading" | "ready" | "error";
  note?: string;
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
  minWidth: number,
  maxRows = 3,
) {
  const rowEnds: number[] = [];
  const packed: {
    event: HistoryEvent;
    x: number;
    width: number;
    wide: boolean;
    row: number;
  }[] = [];
  const sorted = [...events].sort(
    (a, b) => a.year - b.year || a.title.localeCompare(b.title),
  );

  for (const event of sorted) {
    const bar = eventBarMetrics(event, pixelsPerYear, minWidth);
    let row = rowEnds.findIndex((end) => bar.x >= end + PACK_GAP);
    if (row === -1) {
      if (rowEnds.length >= maxRows) {
        row = rowEnds.length - 1;
      } else {
        row = rowEnds.length;
        rowEnds.push(0);
      }
    }
    rowEnds[row] = bar.x + bar.width;
    packed.push({
      event,
      x: bar.x,
      width: bar.width,
      wide: bar.wide,
      row,
    });
  }
  return packed;
}

function visibleYears(
  left: number,
  width: number,
  pixelsPerYear: number,
) {
  const pad = OVERSCAN_PX / pixelsPerYear;
  const start = xToYear(left, pixelsPerYear) - pad;
  const end = xToYear(left + width, pixelsPerYear) + pad;
  return {
    start: Math.max(TIMELINE_START, start),
    end: Math.min(TIMELINE_END, end),
  };
}

function laneHue(
  lane: HistoryLanePref,
  customCategories: CustomHistoryCategory[],
) {
  if (lane.hue !== undefined) return lane.hue;
  return getCategory(lane.category, customCategories).hue;
}

function laneTitle(
  lane: HistoryLanePref,
  customCategories: CustomHistoryCategory[],
) {
  if (lane.label && lane.label.trim()) return lane.label.trim();
  return getCategory(lane.category, customCategories).label;
}

function GripIcon() {
  return (
    <svg
      viewBox="0 0 12 16"
      width="12"
      height="16"
      aria-hidden
      className="fill-current opacity-55"
    >
      <circle cx="3" cy="3" r="1.35" />
      <circle cx="9" cy="3" r="1.35" />
      <circle cx="3" cy="8" r="1.35" />
      <circle cx="9" cy="8" r="1.35" />
      <circle cx="3" cy="13" r="1.35" />
      <circle cx="9" cy="13" r="1.35" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
      className="fill-none stroke-current"
      strokeWidth="1.4"
    >
      <circle cx="8" cy="8" r="2.1" />
      <path d="M8 1.7v1.6M8 12.7v1.6M1.7 8h1.6M12.7 8h1.6M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M3.3 12.7l1.1-1.1M11.6 4.4l1.1-1.1" />
    </svg>
  );
}

export function HistoryTimeline() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement | null>(null);
  const centerYearRef = useRef(defaultHistoryPrefs().centerYear);
  const loadedRef = useRef(new Set<string>());
  const inflightRef = useRef(new Set<string>());
  const customRef = useRef<CustomHistoryCategory[]>([]);
  const cameraRef = useRef({ left: 0, width: 720 });
  const dragLaneId = useRef<string | null>(null);

  const [prefsReady, setPrefsReady] = useState(false);
  const [zoom, setZoom] = useState(defaultHistoryPrefs().zoom);
  const [lanes, setLanes] = useState<HistoryLanePref[]>(
    () => defaultHistoryPrefs().lanes,
  );
  const [customCategories, setCustomCategories] = useState<
    CustomHistoryCategory[]
  >([]);
  const [draftName, setDraftName] = useState("");
  const [addChoice, setAddChoice] = useState("");
  const [configLaneId, setConfigLaneId] = useState<string | null>(null);
  const [eventsById, setEventsById] = useState<Record<string, HistoryEvent>>(
    () => Object.fromEntries(historySeedEvents.map((event) => [event.id, event])),
  );
  const [camera, setCamera] = useState({ left: 0, width: 720 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fillByCategory, setFillByCategory] = useState<
    Record<string, LaneFillState>
  >({});
  const [status, setStatus] = useState<{
    mongo: boolean | null;
    xai: boolean | null;
    note: string;
  }>({ mongo: null, xai: null, note: "Seeded events are ready." });

  customRef.current = customCategories;
  cameraRef.current = camera;

  const zoomSpec = ZOOM_LEVELS[zoom] ?? ZOOM_LEVELS[defaultHistoryPrefs().zoom];
  const granularity = zoomSpec.granularity;
  const pixelsPerYear = zoomSpec.pixelsPerYear;
  const width = timelineWidth(pixelsPerYear);
  const minEventWidth = pointMinWidth(granularity);

  const visible = useMemo(
    () => visibleYears(camera.left, camera.width, pixelsPerYear),
    [camera.left, camera.width, pixelsPerYear],
  );

  const ticks = useMemo(
    () =>
      ticksForRange(
        visible.start,
        visible.end,
        zoomSpec.tick,
        zoomSpec.labelEvery,
        granularity,
      ),
    [granularity, visible.end, visible.start, zoomSpec.labelEvery, zoomSpec.tick],
  );
  const gridTicks = useMemo(
    () => ticks.filter((tick) => tick.grid),
    [ticks],
  );

  const persistPrefs = useCallback(() => {
    saveHistoryPrefs({
      zoom,
      centerYear: centerYearRef.current,
      lanes,
      customCategories: customRef.current,
    });
  }, [lanes, zoom]);

  const applyCameraFromNode = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const left = node.scrollLeft;
    const viewWidth = node.clientWidth || 720;
    centerYearRef.current = xToYear(left + viewWidth / 2, pixelsPerYear);
    setCamera({ left, width: viewWidth });
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
      categories: TimelineCategoryId[],
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
          if (needed.length === 0) {
            setFillByCategory((prev) => ({
              ...prev,
              [category]: prev[category] ?? { status: "ready" },
            }));
            return;
          }

          const keys = needed.map((window) =>
            windowKey(category, gran, window.start),
          );
          keys.forEach((key) => inflightRef.current.add(key));
          setFillByCategory((prev) => ({
            ...prev,
            [category]: { status: "loading" },
          }));

          try {
            const meta = getCategory(category, customRef.current);
            const response = await fetch("/api/history-timeline/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category,
                categoryLabel: meta.label,
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
                for (const event of payload.events ?? []) {
                  if (isRetiredHistoryEvent(event)) continue;
                  next[event.id] = event;
                }
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

            const pending = payload.meta?.pending ?? 0;
            const missing =
              payload.windows?.some((window) => window.source === "missing") ??
              false;
            const empty = !payload.events?.length;
            const xai = payload.meta?.xai === true;
            if (payload.error) {
              setFillByCategory((prev) => ({
                ...prev,
                [category]: {
                  status: "error",
                  note: payload.error,
                },
              }));
            } else if (fill && missing && empty && (!xai || pending === 0)) {
              setFillByCategory((prev) => ({
                ...prev,
                [category]: {
                  status: "error",
                  note: xai
                    ? "Could not fill this lane. Retry?"
                    : "This lane needs a server key to fill.",
                },
              }));
            } else if (fill && missing && pending > 0 && xai) {
              setFillByCategory((prev) => ({
                ...prev,
                [category]: { status: "loading" },
              }));
              window.setTimeout(() => {
                void fetchRange([category], start, end, gran, true);
              }, 500);
            } else {
              setFillByCategory((prev) => ({
                ...prev,
                [category]: { status: "ready" },
              }));
            }
          } catch {
            setFillByCategory((prev) => ({
              ...prev,
              [category]: {
                status: "error",
                note: "Could not reach the timeline cache. Retry?",
              },
            }));
            setStatus((prev) => ({
              ...prev,
              note: "Could not reach the timeline cache. Seeded events still show.",
            }));
          } finally {
            keys.forEach((key) => inflightRef.current.delete(key));
          }
        }),
      );
    },
    [],
  );

  const fillNow = useCallback(
    (categories: TimelineCategoryId[], markLoading = true) => {
      const node = scrollerRef.current;
      const left = node ? node.scrollLeft : cameraRef.current.left;
      const viewWidth = node
        ? node.clientWidth || 720
        : cameraRef.current.width;
      const range = visibleYears(left, viewWidth, pixelsPerYear);
      if (markLoading) {
        for (const category of categories) {
          setFillByCategory((prev) => ({
            ...prev,
            [category]: { status: "loading" },
          }));
        }
      }
      void fetchRange(categories, range.start, range.end, granularity, true);
    },
    [fetchRange, granularity, pixelsPerYear],
  );

  useLayoutEffect(() => {
    const prefs = loadHistoryPrefs();
    setZoom(prefs.zoom);
    setLanes(prefs.lanes);
    setCustomCategories(prefs.customCategories);
    centerYearRef.current = prefs.centerYear;
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    persistPrefs();
  }, [lanes, persistPrefs, prefsReady, zoom, customCategories]);

  useEffect(() => {
    if (!prefsReady) return;
    const node = scrollerRef.current;
    if (!node) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applyCameraFromNode();
      });
    };
    const persist = debounce(() => persistPrefs(), DEBOUNCE_MS);
    const onScrollAndPersist = () => {
      onScroll();
      persist();
    };
    node.addEventListener("scroll", onScrollAndPersist, { passive: true });
    const onResize = debounce(() => applyCameraFromNode(), DEBOUNCE_MS);
    window.addEventListener("resize", onResize);
    return () => {
      persist.cancel();
      onResize.cancel();
      if (frame) window.cancelAnimationFrame(frame);
      node.removeEventListener("scroll", onScrollAndPersist);
      window.removeEventListener("resize", onResize);
    };
  }, [applyCameraFromNode, persistPrefs, prefsReady]);

  useEffect(() => {
    if (!prefsReady) return;
    const node = scrollerRef.current;
    if (!node) return;
    const year = centerYearRef.current;
    const left = yearToX(year, pixelsPerYear) - node.clientWidth / 2;
    node.scrollLeft = Math.max(0, left);
    centerYearRef.current = year;
    applyCameraFromNode();
  }, [applyCameraFromNode, pixelsPerYear, prefsReady]);

  useEffect(() => {
    if (!prefsReady) return;
    fillNow(
      lanes.map((lane) => lane.category),
      false,
    );
  }, [fillNow, lanes, prefsReady]);

  useEffect(() => {
    if (!prefsReady) return;
    const timer = window.setTimeout(() => {
      void fetchRange(
        lanes.map((lane) => lane.category),
        visible.start,
        visible.end,
        granularity,
        true,
      );
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [fetchRange, granularity, lanes, prefsReady, visible.end, visible.start]);

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
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA")
      ) {
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
        setConfigLaneId(null);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyZoom, zoom]);

  const swapLane = (laneId: string, category: TimelineCategoryId) => {
    if (!isTimelineCategory(category)) return;
    setLanes((prev) =>
      prev.map((lane) =>
        lane.id === laneId
          ? { ...lane, category, hue: undefined, label: undefined }
          : lane,
      ),
    );
    setSelectedId(null);
    trackEvent(analyticsEvents.categorySwap, {
      tool: TOOL_SLUG,
      category,
      granularity,
    });
  };

  const addCustomCategory = () => {
    const label = draftName.trim().slice(0, 32);
    if (label.length < 2 || customCategories.length >= MAX_CUSTOM) return;
    if (lanes.length >= MAX_LANES) return;
    const id = nextCustomCategoryId(label, customCategories);
    const hue = CUSTOM_HUE_PRESETS[0].hue;
    const next: CustomHistoryCategory = {
      id,
      label,
      hue,
      hint: "Custom lane",
    };
    setCustomCategories((prev) => [...prev, next]);
    setLanes((prev) => [
      ...prev,
      { id: nextLaneId(prev), category: id, hue, label },
    ]);
    setDraftName("");
    setAddChoice("");
    setSelectedId(null);
    setFillByCategory((prev) => ({
      ...prev,
      [id]: { status: "loading" },
    }));
    trackEvent(analyticsEvents.categorySwap, {
      tool: TOOL_SLUG,
      category: id,
      granularity,
    });
  };

  const removeLane = (laneId: string) => {
    const lane = lanes.find((item) => item.id === laneId);
    if (!lane || lanes.length <= 1) return;
    setLanes((prev) => prev.filter((item) => item.id !== laneId));
    if (isCustomCategoryId(lane.category)) {
      setCustomCategories((prev) =>
        prev.filter((item) => item.id !== lane.category),
      );
    }
    if (configLaneId === laneId) setConfigLaneId(null);
    setSelectedId(null);
  };

  const showCategoryLane = (category: TimelineCategoryId) => {
    if (!isTimelineCategory(category) || lanes.length >= MAX_LANES) return;
    setLanes((prev) => {
      if (prev.some((lane) => lane.category === category)) return prev;
      return [...prev, { id: nextLaneId(prev), category }];
    });
    setAddChoice("");
    setFillByCategory((prev) => ({
      ...prev,
      [category]: prev[category] ?? { status: "loading" },
    }));
  };

  const renameLane = (laneId: string, label: string) => {
    const trimmed = label.trim().slice(0, 32);
    setLanes((prev) =>
      prev.map((lane) =>
        lane.id === laneId
          ? { ...lane, ...(trimmed ? { label: trimmed } : { label: undefined }) }
          : lane,
      ),
    );
    const lane = lanes.find((item) => item.id === laneId);
    if (lane && isCustomCategoryId(lane.category) && trimmed) {
      setCustomCategories((prev) =>
        prev.map((item) =>
          item.id === lane.category ? { ...item, label: trimmed } : item,
        ),
      );
    }
  };

  const moveLane = (laneId: string, direction: -1 | 1) => {
    setLanes((prev) => {
      const index = prev.findIndex((lane) => lane.id === laneId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      if (!item) return prev;
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const setLaneColor = (laneId: string, hue: number) => {
    setLanes((prev) =>
      prev.map((lane) => (lane.id === laneId ? { ...lane, hue } : lane)),
    );
  };

  const onDropLane = (targetId: string) => {
    const sourceId = dragLaneId.current;
    dragLaneId.current = null;
    if (!sourceId || sourceId === targetId) return;
    setLanes((prev) => {
      const from = prev.findIndex((lane) => lane.id === sourceId);
      const to = prev.findIndex((lane) => lane.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      if (!item) return prev;
      next.splice(to, 0, item);
      return next;
    });
  };

  const jumpEra = (preset: (typeof ERA_PRESETS)[number]) => {
    centerYearRef.current = (preset.start + preset.end) / 2;
    applyZoom(preset.zoom);
    window.setTimeout(() => scrollToYear(centerYearRef.current), 30);
  };

  const allEvents = useMemo(
    () => Object.values(eventsById).filter((event) => !isRetiredHistoryEvent(event)),
    [eventsById],
  );
  const selected = selectedId ? eventsById[selectedId] : undefined;
  const categoryOptions = useMemo(
    () => [
      ...historyCategories.map((item) => ({
        id: item.id,
        label: item.label,
      })),
      ...customCategories.map((item) => ({
        id: item.id,
        label: item.label,
      })),
    ],
    [customCategories],
  );
  const usedCategories = useMemo(
    () => new Set(lanes.map((lane) => lane.category)),
    [lanes],
  );
  const addOptions = useMemo(
    () =>
      historyCategories
        .filter((item) => !usedCategories.has(item.id))
        .map((item) => ({ id: item.id, label: item.label })),
    [usedCategories],
  );
  const maxPackRows = subRowsForLanes(lanes.length);
  const bandHeight = laneBandHeight(maxPackRows, ROW_HEIGHT, ROW_GAP, LANE_PAD);
  const configLane = lanes.find((lane) => lane.id === configLaneId);

  useEffect(() => {
    if (selected) {
      detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selected]);

  return (
    <div className="snap-panel p-0">
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
              {formatYearRange(visible.start, visible.end, granularity)}
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
        <form
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (addChoice === CREATE_NEW) addCustomCategory();
            else if (isTimelineCategory(addChoice)) showCategoryLane(addChoice);
          }}
        >
          <label className="min-w-[12rem] text-xs font-medium text-ink-muted">
            Add lane
            <select
              className="snap-input mt-1 min-h-10 min-w-[14rem] px-2.5 text-sm font-normal text-ink"
              value={addChoice}
              disabled={lanes.length >= MAX_LANES}
              onChange={(event) => {
                const value = event.target.value;
                if (value === CREATE_NEW) {
                  setAddChoice(CREATE_NEW);
                  return;
                }
                if (isTimelineCategory(value)) showCategoryLane(value);
                else setAddChoice("");
              }}
            >
              <option value="">Choose a category…</option>
              {addOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
              {customCategories.length < MAX_CUSTOM ? (
                <option value={CREATE_NEW}>Create new…</option>
              ) : null}
            </select>
          </label>
          {addChoice === CREATE_NEW ? (
            <label className="min-w-[12rem] flex-1 text-xs font-medium text-ink-muted">
              Name
              <input
                className="snap-input mt-1 min-h-10 w-full px-2.5 text-sm font-normal text-ink"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="WWII, philosophy, ships…"
                maxLength={32}
                autoComplete="off"
              />
            </label>
          ) : null}
          <button
            type="submit"
            className="snap-btn min-h-10 min-w-10 px-0 text-lg"
            aria-label="Add lane"
            disabled={
              lanes.length >= MAX_LANES ||
              (addChoice === CREATE_NEW
                ? draftName.trim().length < 2
                : !isTimelineCategory(addChoice))
            }
          >
            +
          </button>
        </form>
      </div>

      <div>
        <div
          className="sticky z-[15] border-b border-line bg-surface/95 backdrop-blur-md"
          style={{ top: HEADER_STICKY_TOP }}
        >
          <div className="flex">
            <div
              className={`${GUTTER_CLASS} border-r border-line bg-surface-muted/80`}
              style={{ height: AXIS_HEIGHT }}
            >
              <p className="flex h-full items-center px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                Year
              </p>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                className="relative"
                style={{
                  width,
                  height: AXIS_HEIGHT,
                  transform: `translateX(${-camera.left}px)`,
                }}
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
                        {tick.text}
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
            </div>
          </div>
        </div>

        <div className="flex">
          <div className={`${GUTTER_CLASS} border-r border-line`}>
            {lanes.map((lane) => {
              const title = laneTitle(lane, customCategories);
              const hue = laneHue(lane, customCategories);
              const band = laneBand(lane.category, hue);
              return (
                <div
                  key={lane.id}
                  data-lane-id={lane.id}
                  className="flex items-start gap-1.5 border-t border-line px-2 py-2.5 sm:px-2.5"
                  style={{ height: bandHeight, background: band.background }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={() => onDropLane(lane.id)}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="mt-0.5 grid min-h-8 min-w-7 cursor-grab place-items-center rounded-md text-ink-muted hover:bg-surface/80 hover:text-ink active:cursor-grabbing"
                    aria-label={`Reorder ${title}. Use up or down arrow keys.`}
                    draggable
                    onDragStart={(event) => {
                      dragLaneId.current = lane.id;
                      event.dataTransfer.setData("text/plain", lane.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      dragLaneId.current = lane.id;
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerUp={(event) => {
                      const source = dragLaneId.current;
                      if (!source) return;
                      const hit = document
                        .elementsFromPoint(event.clientX, event.clientY)
                        .find(
                          (node) =>
                            node instanceof HTMLElement && node.dataset.laneId,
                        );
                      if (hit instanceof HTMLElement && hit.dataset.laneId) {
                        onDropLane(hit.dataset.laneId);
                      }
                      dragLaneId.current = null;
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        moveLane(lane.id, -1);
                      } else if (event.key === "ArrowDown") {
                        event.preventDefault();
                        moveLane(lane.id, 1);
                      }
                    }}
                  >
                    <GripIcon />
                  </div>
                  <p className="min-w-0 flex-1 pt-1 text-sm font-semibold leading-snug text-ink">
                    {title}
                  </p>
                  <button
                    type="button"
                    className="grid min-h-8 min-w-8 place-items-center rounded-md text-ink-muted hover:bg-surface/80 hover:text-ink"
                    aria-label={`Configure ${title}`}
                    onClick={() => setConfigLaneId(lane.id)}
                  >
                    <GearIcon />
                  </button>
                  <button
                    type="button"
                    className="grid min-h-8 min-w-8 place-items-center rounded-md text-ink-muted hover:bg-surface/80 hover:text-ink disabled:opacity-30"
                    aria-label={`Remove ${title} lane`}
                    disabled={lanes.length <= 1}
                    onClick={() => removeLane(lane.id)}
                  >
                    ×
                  </button>
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
              {lanes.map((lane) => (
                <LaneRow
                  key={lane.id}
                  category={lane.category}
                  hue={laneHue(lane, customCategories)}
                  customCategories={customCategories}
                  events={allEvents}
                  granularity={granularity}
                  pixelsPerYear={pixelsPerYear}
                  minWidth={minEventWidth}
                  maxRows={maxPackRows}
                  height={bandHeight}
                  visibleStart={visible.start}
                  visibleEnd={visible.end}
                  scrollLeft={camera.left}
                  selectedId={selectedId}
                  fill={fillByCategory[lane.category]}
                  xai={status.xai}
                  onSelect={setSelectedId}
                  onRetry={() => fillNow([lane.category])}
                  laneId={lane.id}
                  onDropLane={onDropLane}
                />
              ))}
              <div
                className="pointer-events-none absolute inset-0 z-20"
                aria-hidden
              >
                {gridTicks.map((tick) => (
                  <div
                    key={`grid-${tick.year}`}
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      left: yearToX(tick.year, pixelsPerYear),
                      background: "light-dark(rgb(29 29 31 / 0.16), rgb(245 245 247 / 0.18))",
                    }}
                  />
                ))}
                <div
                  className="absolute top-0 bottom-0 w-px bg-secondary/45"
                  style={{ left: yearToX(NOW_YEAR, pixelsPerYear) }}
                />
              </div>
            </div>
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

      {configLane ? (
        <LaneConfigDialog
          lane={configLane}
          customCategories={customCategories}
          categoryOptions={categoryOptions.filter(
            (item) =>
              item.id === configLane.category || !usedCategories.has(item.id),
          )}
          onClose={() => setConfigLaneId(null)}
          onColor={(hue) => setLaneColor(configLane.id, hue)}
          onRename={(label) => renameLane(configLane.id, label)}
          onCategory={(category) => swapLane(configLane.id, category)}
        />
      ) : null}

      {selected ? (
        <aside
          ref={detailRef}
          className="border-t border-line bg-surface-muted/60 px-4 py-4 sm:px-5"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {getCategory(selected.category, customCategories).label}
              <span className="mx-2 text-line">·</span>
              {formatYearRange(
                eventSpan(selected).start,
                eventSpan(selected).end,
                granularity,
              )}
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
          <p className="mt-1 text-sm text-ink-muted">
            {getCategory(selected.category, customCategories).hint}
          </p>
          <h3 className="mt-2 font-display text-xl text-ink">{selected.title}</h3>
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
  hue,
  customCategories,
  events,
  granularity,
  pixelsPerYear,
  minWidth,
  maxRows,
  height,
  visibleStart,
  visibleEnd,
  scrollLeft,
  selectedId,
  fill,
  xai,
  onSelect,
  onRetry,
  laneId,
  onDropLane,
}: {
  category: TimelineCategoryId;
  hue?: number;
  customCategories: CustomHistoryCategory[];
  events: HistoryEvent[];
  granularity: HistoryGranularity;
  pixelsPerYear: number;
  minWidth: number;
  maxRows: number;
  height: number;
  visibleStart: number;
  visibleEnd: number;
  scrollLeft: number;
  selectedId: string | null;
  fill?: LaneFillState;
  xai: boolean | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
  laneId: string;
  onDropLane: (targetId: string) => void;
}) {
  const meta = getCategory(category, customCategories);
  const overscanYears = OVERSCAN_PX / pixelsPerYear;
  const visibleEvents = events.filter(
    (event) =>
      event.category === category &&
      shouldShowEvent(event, granularity) &&
      eventOverlaps(
        event,
        visibleStart - overscanYears,
        visibleEnd + overscanYears,
      ),
  );
  const packed = packEvents(visibleEvents, pixelsPerYear, minWidth, maxRows);
  const band = laneBand(category, hue);
  const empty = packed.length === 0;

  return (
    <div
      className="relative overflow-hidden border-t border-line"
      style={{ height, background: band.background }}
      role="list"
      aria-label={`${meta.label} events`}
      aria-busy={fill?.status === "loading"}
      data-lane-id={laneId}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={() => onDropLane(laneId)}
    >
      {empty ? (
        <div
          className="pointer-events-auto absolute inset-y-0 flex items-center"
          style={{ left: scrollLeft + 16, width: "min(24rem, 72%)" }}
        >
          {fill?.status === "loading" ? (
            <p className="text-sm text-ink-muted">Filling this lane…</p>
          ) : fill?.status === "error" ||
            (category.startsWith("custom-") && xai === false) ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-ink-muted">
                {fill?.note ||
                  (xai === false
                    ? "This lane needs a server key to fill."
                    : "Could not fill this lane.")}
              </p>
              <button
                type="button"
                className="snap-btn-secondary min-h-8 px-3 text-xs"
                onClick={onRetry}
              >
                Retry
              </button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Nothing in this window yet.</p>
          )}
        </div>
      ) : null}
      {packed.map(({ event, x, width, wide, row }) => {
        const selected = event.id === selectedId;
        const swatch = eventSwatch(
          event.category,
          event.id,
          selected,
          hue,
        );
        const span = eventSpan(event);
        const range = formatYearRange(span.start, span.end, granularity);
        const labelPad = wide
          ? Math.max(10, Math.min(width - 96, scrollLeft - x + 10))
          : 10;
        return (
          <div key={event.id} role="listitem">
            <button
              type="button"
              onClick={() => onSelect(event.id)}
              aria-pressed={selected}
              title={`${event.title} · ${range}`}
              className={`absolute overflow-hidden rounded-xl border pr-2.5 text-left transition-[filter,box-shadow] hover:brightness-[0.97] ${
                selected ? "shadow-[0_0_0_1px_var(--ink)]" : ""
              } ${wide ? "flex items-center gap-2" : "py-1.5 pl-2.5"}`}
              style={{
                left: x,
                width,
                minWidth,
                top: LANE_PAD + row * (ROW_HEIGHT + ROW_GAP),
                height: ROW_HEIGHT,
                paddingLeft: wide ? labelPad : undefined,
                background: swatch.background,
                borderColor: swatch.border,
                color: swatch.color,
              }}
            >
              {wide ? (
                <>
                  <span className="min-w-0 truncate text-[13px] font-semibold leading-snug">
                    {event.title}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums opacity-70">
                    {range}
                    {event.projected ? " · Proj." : ""}
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[11px] tabular-nums opacity-70">
                      {formatYearRange(event.year, event.year, granularity)}
                    </span>
                    {event.projected ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary">
                        Proj.
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] font-semibold leading-snug">
                    {event.title}
                  </span>
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function LaneConfigDialog({
  lane,
  customCategories,
  categoryOptions,
  onClose,
  onColor,
  onRename,
  onCategory,
}: {
  lane: HistoryLanePref;
  customCategories: CustomHistoryCategory[];
  categoryOptions: Array<{ id: string; label: string }>;
  onClose: () => void;
  onColor: (hue: number) => void;
  onRename: (label: string) => void;
  onCategory: (category: TimelineCategoryId) => void;
}) {
  const title = laneTitle(lane, customCategories);
  const hue = laneHue(lane, customCategories);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = dialogRef.current?.querySelector<HTMLElement>("input, button");
    node?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lane-config-title"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="lane-config-title" className="font-display text-lg text-ink">
            Lane settings
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-ink-muted hover:text-ink"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <label className="mt-4 block text-xs font-medium text-ink-muted">
          Name
          <input
            className="snap-input mt-1 min-h-10 w-full px-2.5 text-sm font-normal text-ink"
            defaultValue={title}
            maxLength={32}
            onBlur={(event) => onRename(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onRename((event.target as HTMLInputElement).value);
              }
            }}
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-ink-muted">
          Category
          <select
            className="snap-input mt-1 min-h-10 w-full px-2.5 text-sm font-normal text-ink"
            value={lane.category}
            onChange={(event) => {
              const value = event.target.value;
              if (isTimelineCategory(value)) onCategory(value);
            }}
          >
            {categoryOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="mt-3 border-0 p-0">
          <legend className="text-xs font-medium text-ink-muted">Color</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CUSTOM_HUE_PRESETS.map((preset) => {
              const swatch = hueSwatch(preset.hue);
              const active =
                hue !== undefined &&
                Math.abs((((hue % 360) + 360) % 360) - preset.hue) < 0.5;
              return (
                <button
                  key={preset.hue}
                  type="button"
                  title={preset.label}
                  aria-pressed={active}
                  aria-label={preset.label}
                  onClick={() => onColor(preset.hue)}
                  className="h-8 w-8 rounded-full border"
                  style={{
                    background: swatch.background,
                    borderColor: active ? "var(--ink)" : swatch.border,
                    boxShadow: active
                      ? "0 0 0 2px var(--bg), 0 0 0 3px var(--ink)"
                      : undefined,
                  }}
                />
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
