export const TIMELINE_START = -3000;
export const TIMELINE_END = 2100;
export const NOW_YEAR = 2026;

export const historyCategories = [
  {
    id: "empires",
    label: "Empires",
    hint: "States that ruled far beyond one city",
    accent: "ink",
  },
  {
    id: "inventions",
    label: "Inventions",
    hint: "Tools and techniques that changed daily life",
    accent: "secondary",
  },
  {
    id: "musicians",
    label: "Musicians",
    hint: "Composers, performers, and popular music",
    accent: "muted",
  },
  {
    id: "wars",
    label: "Wars",
    hint: "Conflicts that redrew maps and memory",
    accent: "bad",
  },
  {
    id: "explorations",
    label: "Explorations",
    hint: "Voyages across land, sea, sky, and space",
    accent: "ok",
  },
  {
    id: "science",
    label: "Science",
    hint: "Ideas, experiments, and discoveries",
    accent: "secondary",
  },
  {
    id: "art",
    label: "Art",
    hint: "Works and movements people still visit",
    accent: "ink",
  },
  {
    id: "sports",
    label: "Sports",
    hint: "Games, records, and firsts",
    accent: "ok",
  },
] as const;

export type HistoryCategoryId = (typeof historyCategories)[number]["id"];
export type HistoryGranularity = "millennium" | "century" | "decade" | "year";
export type HistoryEventSource = "seed" | "ai";

export type HistoryEvent = {
  id: string;
  category: HistoryCategoryId;
  year: number;
  endYear?: number;
  title: string;
  summary: string;
  significance: 1 | 2 | 3 | 4 | 5;
  projected?: boolean;
  source: HistoryEventSource;
  granularity?: HistoryGranularity;
};

export type HistoryWindow = {
  start: number;
  end: number;
};

export type GranularitySpec = {
  size: number;
  label: string;
  minSeed: number;
  targetCount: number;
  minSignificance: 1 | 2 | 3 | 4 | 5;
};

export const GRANULARITY: Record<HistoryGranularity, GranularitySpec> = {
  millennium: {
    size: 1000,
    label: "Millennia",
    minSeed: 2,
    targetCount: 6,
    minSignificance: 4,
  },
  century: {
    size: 100,
    label: "Centuries",
    minSeed: 2,
    targetCount: 8,
    minSignificance: 3,
  },
  decade: {
    size: 10,
    label: "Decades",
    minSeed: 1,
    targetCount: 6,
    minSignificance: 2,
  },
  year: {
    size: 5,
    label: "Years",
    minSeed: 0,
    targetCount: 4,
    minSignificance: 1,
  },
};

export const GRANULARITY_ORDER: HistoryGranularity[] = [
  "millennium",
  "century",
  "decade",
  "year",
];

export type ZoomLevel = {
  level: number;
  granularity: HistoryGranularity;
  pixelsPerYear: number;
  tick: number;
  labelEvery: number;
};

export const ZOOM_LEVELS: ZoomLevel[] = [
  {
    level: 0,
    granularity: "millennium",
    pixelsPerYear: 0.3,
    tick: 500,
    labelEvery: 500,
  },
  {
    level: 1,
    granularity: "century",
    pixelsPerYear: 1.2,
    tick: 50,
    labelEvery: 100,
  },
  {
    level: 2,
    granularity: "decade",
    pixelsPerYear: 5.5,
    tick: 10,
    labelEvery: 20,
  },
  {
    level: 3,
    granularity: "year",
    pixelsPerYear: 18,
    tick: 1,
    labelEvery: 5,
  },
];

export const DEFAULT_ZOOM = 1;
export const DEFAULT_CENTER_YEAR = 1700;
export const DEFAULT_LANES: HistoryCategoryId[] = [
  "empires",
  "inventions",
  "wars",
  "musicians",
];

export const ERA_PRESETS = [
  { id: "ancient", label: "Ancient", start: -3000, end: -500, zoom: 1 },
  { id: "classical", label: "Classical", start: -800, end: 500, zoom: 1 },
  { id: "medieval", label: "Medieval", start: 500, end: 1500, zoom: 1 },
  { id: "early-modern", label: "Early modern", start: 1450, end: 1800, zoom: 2 },
  { id: "modern", label: "Modern", start: 1800, end: NOW_YEAR, zoom: 2 },
  { id: "future", label: "Future", start: NOW_YEAR, end: 2100, zoom: 2 },
] as const;

const CATEGORY_IDS = new Set<string>(historyCategories.map((item) => item.id));

export function isHistoryCategory(value: string): value is HistoryCategoryId {
  return CATEGORY_IDS.has(value);
}

export function isHistoryGranularity(
  value: string,
): value is HistoryGranularity {
  return value in GRANULARITY;
}

export function getCategory(id: HistoryCategoryId) {
  return historyCategories.find((item) => item.id === id) ?? historyCategories[0];
}

export function clampYear(year: number) {
  return Math.min(TIMELINE_END, Math.max(TIMELINE_START, year));
}

export function alignWindowStart(year: number, size: number) {
  return Math.floor(year / size) * size;
}

export function windowsOverlapping(
  start: number,
  end: number,
  granularity: HistoryGranularity,
  limit = 12,
): HistoryWindow[] {
  const size = GRANULARITY[granularity].size;
  const from = alignWindowStart(clampYear(Math.min(start, end)), size);
  const to = clampYear(Math.max(start, end));
  const windows: HistoryWindow[] = [];
  for (let cursor = from; cursor < to && windows.length < limit; cursor += size) {
    windows.push({ start: cursor, end: cursor + size });
  }
  return windows;
}

export function windowKey(
  category: HistoryCategoryId,
  granularity: HistoryGranularity,
  start: number,
) {
  return `${category}:${granularity}:${start}`;
}

export function eventId(
  category: HistoryCategoryId,
  year: number,
  title: string,
) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${category}-${year}-${slug || "event"}`;
}

export function formatYear(year: number) {
  if (year < 0) return `${Math.abs(year)} BCE`;
  if (year === 0) return "1 BCE";
  if (year > NOW_YEAR) return `${year}`;
  return `${year}`;
}

export function formatYearRange(start: number, end: number) {
  if (start === end) return formatYear(start);
  return `${formatYear(start)}–${formatYear(end)}`;
}

export type EventSpan = {
  start: number;
  end: number;
  point: boolean;
};

/** Pixel width for a one-year / missing-end event so the label stays readable. */
export const POINT_EVENT_MIN_WIDTH = 118;
/** Bars at least this wide show title + year range on one line. */
export const WIDE_EVENT_LABEL_WIDTH = 168;

/**
 * Map an event onto the time axis.
 * Missing/equal endYear → point. Future end on a non-projected event → NOW.
 * Projected forecasts keep their own future end and do not snap to NOW.
 */
export function eventSpan(event: HistoryEvent): EventSpan {
  const start = event.year;
  if (event.projected) {
    const end =
      event.endYear !== undefined && event.endYear > start
        ? event.endYear
        : start;
    return { start, end, point: end <= start };
  }
  if (event.endYear === undefined || event.endYear <= start) {
    return { start, end: start, point: true };
  }
  const end = Math.min(event.endYear, NOW_YEAR);
  return { start, end, point: end <= start };
}

export function eventBarMetrics(event: HistoryEvent, pixelsPerYear: number) {
  const span = eventSpan(event);
  const x = yearToX(span.start, pixelsPerYear);
  const raw = (span.end - span.start) * pixelsPerYear;
  const width = span.point
    ? POINT_EVENT_MIN_WIDTH
    : Math.max(POINT_EVENT_MIN_WIDTH, raw);
  return { ...span, x, width, wide: width >= WIDE_EVENT_LABEL_WIDTH };
}

export function eventOverlaps(
  event: HistoryEvent,
  start: number,
  end: number,
) {
  const span = eventSpan(event);
  return span.start < end && span.end >= start;
}

export function significanceFloor(granularity: HistoryGranularity) {
  return GRANULARITY[granularity].minSignificance;
}

export function isCoarserOrEqual(
  eventGranularity: HistoryGranularity | undefined,
  current: HistoryGranularity,
) {
  if (!eventGranularity) return true;
  return (
    GRANULARITY_ORDER.indexOf(eventGranularity) <=
    GRANULARITY_ORDER.indexOf(current)
  );
}

export function shouldShowEvent(
  event: HistoryEvent,
  granularity: HistoryGranularity,
) {
  if (event.significance < significanceFloor(granularity)) return false;
  return isCoarserOrEqual(event.granularity, granularity);
}

export function mergeEvents(...groups: HistoryEvent[][]) {
  const seen = new Set<string>();
  const merged: HistoryEvent[] = [];
  for (const group of groups) {
    for (const event of group) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      merged.push(event);
    }
  }
  return merged.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
}

export function yearToX(year: number, pixelsPerYear: number) {
  return (year - TIMELINE_START) * pixelsPerYear;
}

export function xToYear(x: number, pixelsPerYear: number) {
  return TIMELINE_START + x / pixelsPerYear;
}

export function timelineWidth(pixelsPerYear: number) {
  return (TIMELINE_END - TIMELINE_START) * pixelsPerYear;
}

export function ticksForRange(
  start: number,
  end: number,
  tick: number,
  labelEvery: number,
) {
  const first = Math.ceil(start / tick) * tick;
  const marks: { year: number; label: boolean }[] = [];
  for (let year = first; year <= end; year += tick) {
    marks.push({ year, label: year % labelEvery === 0 });
  }
  return marks;
}
