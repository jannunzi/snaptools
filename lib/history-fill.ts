import {
  GRANULARITY,
  isHistoryCategory,
  type HistoryGranularity,
  type HistoryWindow,
  type TimelineCategoryId,
} from "@/lib/history-timeline";

/** BCE / turn-of-era windows that should not stay near-empty after a fill. */
export function isRichAncientWindow(
  category: TimelineCategoryId,
  window: HistoryWindow,
) {
  if (window.end > 1) return false;
  if (category === "musicians" && window.end < -1600) return false;
  if (isHistoryCategory(category) || category.startsWith("custom-")) return true;
  return true;
}

/** Minimum events (seed + generated) before a rich ancient window is “done”. */
export function ancientFillFloor(granularity: HistoryGranularity) {
  const target = GRANULARITY[granularity].targetCount;
  return Math.max(3, Math.ceil(target / 2));
}

export function ancientWindowTooThin(
  eventCount: number,
  granularity: HistoryGranularity,
  category: TimelineCategoryId,
  window: HistoryWindow,
) {
  if (!isRichAncientWindow(category, window)) return false;
  return eventCount < ancientFillFloor(granularity);
}
