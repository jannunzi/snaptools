import type { TimelineCategoryId } from "@/lib/history-timeline";

/** Cached / generated titles that must not sit in Empires. */
export const EMPIRE_MISFILE_TITLES = new Set([
  "Battle of Tours",
  "Umayyad siege of Constantinople",
  "Siege of Constantinople",
  "Second Arab siege of Constantinople",
  "Battle of Talas",
  "Battle of the Talas",
]);

const WAR_TITLE_RE =
  /\b(battle|siege|sack|skirmish|campaign|offensive|invasion)\b/i;
const WAR_WORD_RE = /\bwars?\b/i;

export function looksLikeWarTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return false;
  if (EMPIRE_MISFILE_TITLES.has(trimmed)) return true;
  if (WAR_TITLE_RE.test(trimmed)) return true;
  if (WAR_WORD_RE.test(trimmed)) return true;
  return false;
}

/**
 * Events must belong to the lane’s category id. Empires is polities only —
 * battles and sieges never render there, even if a cache row stamped
 * category: "empires" because that was the request being filled.
 */
export function eventFitsCategory(
  event: { category: string; title: string },
  category: TimelineCategoryId,
) {
  if (event.category !== category) return false;
  if (category === "empires" && looksLikeWarTitle(event.title)) return false;
  return true;
}

export function withoutMisfitEvents<T extends { category: string; title: string }>(
  events: T[],
  category: TimelineCategoryId,
) {
  return events.filter((event) => eventFitsCategory(event, category));
}
