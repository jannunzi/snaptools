import {
  DEFAULT_CENTER_YEAR,
  DEFAULT_LANES,
  DEFAULT_ZOOM,
  ZOOM_LEVELS,
  clampYear,
  historyCategories,
  isCustomCategoryId,
  isTimelineCategory,
  slugifyCategory,
  type CustomHistoryCategory,
  type TimelineCategoryId,
} from "@/lib/history-timeline";

export const HISTORY_PREFS_KEY = "snaptools.history-timeline.v1";

export const CUSTOM_HUE_PRESETS = [
  { hue: 32, label: "Sand" },
  { hue: 210, label: "Slate" },
  { hue: 322, label: "Rose" },
  { hue: 10, label: "Clay" },
  { hue: 92, label: "Sage" },
  { hue: 260, label: "Lilac" },
  { hue: 0, label: "Stone" },
  { hue: 48, label: "Straw" },
] as const;

export type HistoryLanePref = {
  id: string;
  category: TimelineCategoryId;
};

export type HistoryTimelinePrefs = {
  zoom: number;
  centerYear: number;
  lanes: HistoryLanePref[];
  customCategories: CustomHistoryCategory[];
};

export function defaultHistoryPrefs(): HistoryTimelinePrefs {
  return {
    zoom: DEFAULT_ZOOM,
    centerYear: DEFAULT_CENTER_YEAR,
    lanes: DEFAULT_LANES.map((category, index) => ({
      id: `lane-${index}`,
      category,
    })),
    customCategories: [],
  };
}

function clampHue(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const hue = ((n % 360) + 360) % 360;
  return hue;
}

export function nextCustomCategoryId(
  label: string,
  existing: CustomHistoryCategory[],
) {
  const base = `custom-${slugifyCategory(label)}`;
  const taken = new Set(existing.map((item) => item.id));
  if (isCustomCategoryId(base) && !taken.has(base)) return base;
  for (let i = 2; i < 50; i += 1) {
    const id = `${base}-${i}`.slice(0, 47);
    if (isCustomCategoryId(id) && !taken.has(id)) return id;
  }
  return `custom-${Date.now().toString(36)}`;
}

export function parseHistoryPrefs(raw: unknown): HistoryTimelinePrefs {
  const defaults = defaultHistoryPrefs();
  if (!raw || typeof raw !== "object") return defaults;
  const row = raw as Record<string, unknown>;

  const zoomN = Math.round(Number(row.zoom));
  const zoom = Number.isFinite(zoomN)
    ? Math.min(ZOOM_LEVELS.length - 1, Math.max(0, zoomN))
    : defaults.zoom;

  const centerYear = Number.isFinite(Number(row.centerYear))
    ? clampYear(Number(row.centerYear))
    : defaults.centerYear;

  const customCategories: CustomHistoryCategory[] = [];
  if (Array.isArray(row.customCategories)) {
    for (const item of row.customCategories.slice(0, 24)) {
      if (!item || typeof item !== "object") continue;
      const cat = item as Record<string, unknown>;
      const id = String(cat.id ?? "");
      const label = String(cat.label ?? "").trim().slice(0, 32);
      const hue = clampHue(cat.hue);
      if (!isCustomCategoryId(id) || label.length < 1 || hue === null) continue;
      customCategories.push({
        id,
        label,
        hue,
        hint:
          typeof cat.hint === "string"
            ? cat.hint.trim().slice(0, 80)
            : undefined,
      });
    }
  }

  const known = new Set<string>([
    ...historyCategories.map((item) => item.id),
    ...customCategories.map((item) => item.id),
  ]);

  let lanes = defaults.lanes;
  if (Array.isArray(row.lanes) && row.lanes.length > 0) {
    const parsed: HistoryLanePref[] = [];
    for (const [index, item] of row.lanes.slice(0, 6).entries()) {
      if (!item || typeof item !== "object") continue;
      const lane = item as Record<string, unknown>;
      const category = String(lane.category ?? "");
      if (!isTimelineCategory(category) || !known.has(category)) continue;
      parsed.push({
        id: String(lane.id ?? `lane-${index}`).slice(0, 40) || `lane-${index}`,
        category,
      });
    }
    if (parsed.length > 0) {
      while (parsed.length < defaults.lanes.length) {
        const fallback = defaults.lanes[parsed.length];
        if (fallback) parsed.push(fallback);
        else break;
      }
      lanes = parsed;
    }
  }

  return { zoom, centerYear, lanes, customCategories };
}

export function loadHistoryPrefs(): HistoryTimelinePrefs {
  if (typeof window === "undefined") return defaultHistoryPrefs();
  try {
    const raw = window.localStorage.getItem(HISTORY_PREFS_KEY);
    if (!raw) return defaultHistoryPrefs();
    return parseHistoryPrefs(JSON.parse(raw) as unknown);
  } catch {
    return defaultHistoryPrefs();
  }
}

export function saveHistoryPrefs(prefs: HistoryTimelinePrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode or quota — view still works for this visit.
  }
}
