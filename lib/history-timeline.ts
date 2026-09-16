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
export type TimelineCategoryId = string;
export type HistoryGranularity =
  | "millennium"
  | "century"
  | "decade"
  | "year"
  | "month"
  | "week"
  | "day";
export type HistoryEventSource = "seed" | "ai";

export type CustomHistoryCategory = {
  id: string;
  label: string;
  hue: number;
  hint?: string;
};

export type HistoryEvent = {
  id: string;
  category: TimelineCategoryId;
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
  month: {
    size: 1,
    label: "Months",
    minSeed: 0,
    targetCount: 8,
    minSignificance: 1,
  },
  week: {
    size: 1 / 12,
    label: "Weeks",
    minSeed: 0,
    targetCount: 6,
    minSignificance: 1,
  },
  day: {
    size: 1 / 12,
    label: "Days",
    minSeed: 0,
    targetCount: 5,
    minSignificance: 1,
  },
};

export const GRANULARITY_ORDER: HistoryGranularity[] = [
  "millennium",
  "century",
  "decade",
  "year",
  "month",
  "week",
  "day",
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
    labelEvery: 1000,
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
  {
    level: 4,
    granularity: "month",
    pixelsPerYear: 220,
    tick: 1 / 12,
    labelEvery: 1 / 12,
  },
  {
    level: 5,
    granularity: "week",
    pixelsPerYear: 560,
    tick: 7 / 365,
    labelEvery: 14 / 365,
  },
  {
    level: 6,
    granularity: "day",
    pixelsPerYear: 1400,
    tick: 1 / 365,
    labelEvery: 7 / 365,
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
  { id: "medieval", label: "Medieval", start: 500, end: 1200, zoom: 1 },
  { id: "early-modern", label: "Early modern", start: 1450, end: 1800, zoom: 2 },
  { id: "modern", label: "Modern", start: 1800, end: NOW_YEAR, zoom: 2 },
  { id: "future", label: "Future", start: NOW_YEAR, end: 2100, zoom: 2 },
] as const;

const CATEGORY_IDS = new Set<string>(historyCategories.map((item) => item.id));
const CUSTOM_CATEGORY_RE = /^custom-[a-z0-9-]{1,40}$/;

export function isHistoryCategory(value: string): value is HistoryCategoryId {
  return CATEGORY_IDS.has(value);
}

export function isCustomCategoryId(value: string) {
  return CUSTOM_CATEGORY_RE.test(value);
}

export function isTimelineCategory(value: string) {
  return isHistoryCategory(value) || isCustomCategoryId(value);
}

export function slugifyCategory(label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
  return slug || "topic";
}

export function isHistoryGranularity(
  value: string,
): value is HistoryGranularity {
  return value in GRANULARITY;
}

export function getBuiltinCategory(id: string) {
  return historyCategories.find((item) => item.id === id) ?? null;
}

export function getCategory(
  id: string,
  custom: CustomHistoryCategory[] = [],
): { id: string; label: string; hint: string; hue?: number } {
  const builtin = getBuiltinCategory(id);
  if (builtin) return builtin;
  const match = custom.find((item) => item.id === id);
  if (match) {
    return {
      id: match.id,
      label: match.label,
      hint: match.hint || "Custom lane",
      hue: match.hue,
    };
  }
  return {
    id,
    label: id.replace(/^custom-/, "").replace(/-/g, " ") || "Custom",
    hint: "Custom lane",
  };
}

export function clampYear(year: number) {
  return Math.min(TIMELINE_END, Math.max(TIMELINE_START, year));
}

export function alignWindowStart(year: number, size: number) {
  return Math.floor(year / size + 1e-9) * size;
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
  for (let i = 0; windows.length < limit; i += 1) {
    const cursor = from + i * size;
    if (cursor >= to - 1e-9) break;
    windows.push({ start: cursor, end: cursor + size });
  }
  return windows;
}

export function windowKey(
  category: TimelineCategoryId,
  granularity: HistoryGranularity,
  start: number,
) {
  return `${category}:${granularity}:${start.toFixed(6)}`;
}

export function eventId(
  category: TimelineCategoryId,
  year: number,
  title: string,
) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const yearKey = Number.isInteger(year) ? String(year) : year.toFixed(4);
  return `${category}-${yearKey}-${slug || "event"}`;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function yearToParts(year: number) {
  if (year < 0) {
    return { year: Math.trunc(year), month: 1, day: 1 };
  }
  const y = Math.floor(year);
  let dayOfYear = Math.min(364, Math.max(0, Math.floor((year - y) * 365)));
  let month = 1;
  for (let i = 0; i < 12; i += 1) {
    const days = MONTH_DAYS[i] ?? 30;
    if (dayOfYear < days) {
      month = i + 1;
      return { year: y, month, day: dayOfYear + 1 };
    }
    dayOfYear -= days;
  }
  return { year: y, month: 12, day: 31 };
}

export function partsToYear(year: number, month = 1, day = 1) {
  if (year < 0) return year;
  const m = Math.min(12, Math.max(1, Math.round(month)));
  const d = Math.min(MONTH_DAYS[m - 1] ?? 28, Math.max(1, Math.round(day)));
  let doy = d - 1;
  for (let i = 0; i < m - 1; i += 1) doy += MONTH_DAYS[i] ?? 30;
  return year + doy / 365;
}

export function formatYear(year: number) {
  if (year < 0) return `${Math.abs(Math.round(year))} BCE`;
  if (year === 0) return "1 BCE";
  const whole = Math.round(year);
  if (year > NOW_YEAR) return `${whole}`;
  return `${whole}`;
}

export function formatTimelineInstant(
  year: number,
  granularity: HistoryGranularity,
) {
  if (year < 0 || granularity === "millennium" || granularity === "century" || granularity === "decade") {
    return formatYear(year);
  }
  const parts = yearToParts(year);
  if (granularity === "year") return `${parts.year}`;
  if (granularity === "month") {
    return `${MONTH_LABELS[parts.month - 1]} ${parts.year}`;
  }
  return `${parts.day} ${MONTH_LABELS[parts.month - 1]} ${parts.year}`;
}

export function formatYearRange(
  start: number,
  end: number,
  granularity: HistoryGranularity = "year",
) {
  if (Math.abs(end - start) < 1e-6) {
    return formatTimelineInstant(start, granularity);
  }
  return `${formatTimelineInstant(start, granularity)}–${formatTimelineInstant(end, granularity)}`;
}

export function pointMinWidth(granularity: HistoryGranularity) {
  if (granularity === "day") return 36;
  if (granularity === "week") return 48;
  if (granularity === "month") return 72;
  return POINT_EVENT_MIN_WIDTH;
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

export function eventBarMetrics(
  event: HistoryEvent,
  pixelsPerYear: number,
  minWidth = POINT_EVENT_MIN_WIDTH,
) {
  const span = eventSpan(event);
  const x = yearToX(span.start, pixelsPerYear);
  const raw = (span.end - span.start) * pixelsPerYear;
  const width = span.point ? minWidth : Math.max(minWidth, raw);
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

export type TimelineTick = {
  year: number;
  label: boolean;
  grid: boolean;
  text: string;
};

export function ticksForRange(
  start: number,
  end: number,
  tick: number,
  labelEvery: number,
  granularity: HistoryGranularity = "year",
): TimelineTick[] {
  if (granularity === "month" || granularity === "week" || granularity === "day") {
    return civilTicksForRange(start, end, granularity);
  }

  const step = tick > 0 ? tick : 1;
  const labelStep = labelEvery > 0 ? labelEvery : step;
  // Align to year 0 so panning does not phase-shift 100/200 into 150/250.
  const first = Math.ceil(start / step - 1e-9) * step;
  const marks: TimelineTick[] = [];
  const maxMarks = 240;
  for (let i = 0; i < maxMarks; i += 1) {
    const year = first + i * step;
    if (year > end + 1e-9) break;
    const label =
      Math.abs(Math.round(year / labelStep) * labelStep - year) < step / 3;
    marks.push({
      year,
      label,
      grid: label,
      text: formatTimelineInstant(year, granularity),
    });
  }
  return marks;
}

function civilTicksForRange(
  start: number,
  end: number,
  granularity: HistoryGranularity,
): TimelineTick[] {
  const marks: TimelineTick[] = [];
  const maxMarks = 240;

  if (start < 0) {
    const yearStart = Math.ceil(start);
    const yearEnd = Math.min(-1, Math.floor(end));
    for (let y = yearStart; y <= yearEnd && marks.length < maxMarks; y += 1) {
      const label = y % 10 === 0 || granularity !== "day";
      marks.push({
        year: y,
        label,
        grid: label,
        text: formatYear(y),
      });
    }
    if (end <= 0) return marks;
    start = 0;
  }

  const from = yearToParts(Math.max(0, start));

  if (granularity === "month") {
    let y = from.year;
    let month = from.month;
    while (marks.length < maxMarks) {
      const year = partsToYear(y, month, 1);
      if (year > end + 1e-9) break;
      if (year >= start - 1 / 12) {
        const label = month === 1 || month === 4 || month === 7 || month === 10;
        marks.push({
          year,
          label,
          grid: true,
          text: month === 1 ? String(y) : (MONTH_LABELS[month - 1] ?? ""),
        });
      }
      month += 1;
      if (month > 12) {
        month = 1;
        y += 1;
      }
    }
    return marks;
  }

  if (granularity === "week") {
    let y = from.year;
    let doy = 0;
    for (let i = 0; i < from.month - 1; i += 1) doy += MONTH_DAYS[i] ?? 30;
    doy += from.day - 1;
    doy = Math.floor(doy / 7) * 7;
    while (marks.length < maxMarks) {
      const year = y + doy / 365;
      if (year > end + 1e-9) break;
      if (year >= start - 7 / 365) {
        const parts = yearToParts(year);
        const monthStart = parts.day <= 7;
        marks.push({
          year,
          label: monthStart,
          grid: true,
          text:
            parts.month === 1 && monthStart
              ? String(y)
              : monthStart
                ? (MONTH_LABELS[parts.month - 1] ?? "")
                : "",
        });
      }
      doy += 7;
      if (doy >= 365) {
        y += 1;
        doy -= 365;
      }
    }
    return marks;
  }

  let y = from.year;
  let month = from.month;
  let day = from.day;
  while (marks.length < maxMarks) {
    const year = partsToYear(y, month, day);
    if (year > end + 1e-9) break;
    if (year >= start - 1 / 365) {
      const major = day === 1 || day === 8 || day === 15 || day === 22;
      marks.push({
        year,
        label: major,
        grid: major,
        text:
          day === 1
            ? `${MONTH_LABELS[month - 1] ?? ""} ${y}`
            : String(day),
      });
    }
    day += 1;
    const dim = MONTH_DAYS[month - 1] ?? 30;
    if (day > dim) {
      day = 1;
      month += 1;
      if (month > 12) {
        month = 1;
        y += 1;
      }
    }
  }
  return marks;
}
