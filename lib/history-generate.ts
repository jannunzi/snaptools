import {
  eventId,
  formatYearRange,
  GRANULARITY,
  getCategory,
  NOW_YEAR,
  partsToYear,
  type HistoryEvent,
  type HistoryGranularity,
  type HistoryWindow,
  type TimelineCategoryId,
} from "@/lib/history-timeline";
import { XAI_CHAT_MODEL, xaiChatJson } from "@/lib/xai";

const SYSTEM_PROMPT = [
  "You are a careful historian writing captions for a horizontal world-history timeline.",
  "Return only JSON of the form {\"events\":[...]} with no markdown.",
  "Each event must include: year (number; negative = BCE), endYear (number or null), title, summary, significance (1-5), projected (boolean).",
  "Optional month (1-12) and day (1-31) refine the start date when the civil date is known.",
  "For empires, dynasties, wars, lives, voyages, and other spans, set endYear to the conventional end. If it still exists today, set endYear to the present year.",
  "Point events (an invention, a single work, a single day) use endYear null.",
  "Be accurate. Prefer conventional scholarly dates. Do not invent fake day-level precision.",
  "If the window is after the present year, mark projected true and write cautious forecasts, not science fiction.",
  "No mythology presented as fact. No copyrighted long quotations. One or two sentences per summary.",
  "Titles stay short. Events must belong to the requested category and fall inside the year window.",
  "For Empires include long-lived states when they fall in the window — examples: Roman Republic (c. 509–27 BCE), Roman Empire (27 BCE–476 CE, West), Eastern Roman / Byzantine Empire (330–1453), Sassanid (to 651), Umayyad, Abbasid, Carolingian, Holy Roman Empire (from 800/962), Tang, Song, First Bulgarian Empire, Ghana Empire, Khmer Empire. Do not treat 27 BCE as the start of Rome as a state.",
  "If the category label is a specific subject (for example WWII, fashion, or ships), fill that subject in the window — do not substitute a generic world-history list.",
].join(" ");

function clampSignificance(value: unknown): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(Number(value));
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 4;
  return 5;
}

function asInstant(
  row: Record<string, unknown>,
  granularity: HistoryGranularity,
) {
  const year = Number(row.year);
  if (!Number.isFinite(year)) return null;

  const fine =
    granularity === "month" ||
    granularity === "week" ||
    granularity === "day";

  if (!fine) return Math.round(year);
  if (year < 0) return Math.round(year);

  const month = Number(row.month);
  const day = Number(row.day);
  if (Number.isFinite(month) && month >= 1 && month <= 12) {
    return partsToYear(
      Math.trunc(year),
      month,
      Number.isFinite(day) ? day : 1,
    );
  }
  return year;
}

function parseGeneratedEvents(
  payload: unknown,
  category: TimelineCategoryId,
  window: HistoryWindow,
  granularity: HistoryGranularity,
): HistoryEvent[] {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const list = Array.isArray(record.events) ? record.events : [];
  const slack = GRANULARITY[granularity].size;
  const events: HistoryEvent[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const year = asInstant(row, granularity);
    if (year === null) continue;
    if (year < window.start - slack || year >= window.end + slack) continue;

    const title = String(row.title ?? "").trim().slice(0, 80);
    const summary = String(row.summary ?? "").trim().slice(0, 280);
    if (!title || !summary) continue;

    const endYearRaw = asInstant(
      { year: row.endYear, month: row.endMonth, day: row.endDay },
      granularity,
    );
    const endYear =
      endYearRaw !== null && endYearRaw > year ? endYearRaw : undefined;
    const projected =
      Boolean(row.projected) || year > NOW_YEAR || (endYear ?? year) > NOW_YEAR;

    events.push({
      id: eventId(category, year, title),
      category,
      year,
      endYear,
      title,
      summary,
      significance: clampSignificance(row.significance),
      projected,
      source: "ai",
      granularity,
    });
  }

  return events;
}

function precisionHint(granularity: HistoryGranularity) {
  if (granularity === "day") {
    return "Prefer events with a known calendar day. Include month and day. Skip undated year-only items unless nothing dated exists.";
  }
  if (granularity === "week") {
    return "Prefer events dated to a week or day. Include month and day when known.";
  }
  if (granularity === "month") {
    return "Prefer events dated to a month. Include month (and day when known).";
  }
  return "Year-level dates are enough. Do not invent a month or day.";
}

export async function generateHistoryWindow(options: {
  apiKey: string;
  category: TimelineCategoryId;
  categoryLabel?: string;
  granularity: HistoryGranularity;
  window: HistoryWindow;
  knownTitles: string[];
}): Promise<HistoryEvent[]> {
  const spec = GRANULARITY[options.granularity];
  const category = getCategory(options.category, [
    {
      id: options.category,
      label: options.categoryLabel || getCategory(options.category).label,
      hue: 210,
    },
  ]);
  const known = options.knownTitles.slice(0, 16).join("; ") || "none";

  const user = [
    `Category: ${category.label} — ${category.hint}`,
    `Window: ${formatYearRange(options.window.start, options.window.end, options.granularity)} (start inclusive, end exclusive).`,
    `Granularity: ${options.granularity}. Aim for ${spec.targetCount} distinct events at this resolution.`,
    precisionHint(options.granularity),
    `Present year: ${NOW_YEAR}. Years after that are forecasts.`,
    `Do not repeat these already-shown titles: ${known}.`,
    `For long-lived subjects (empires, wars, composers' lives, expeditions) endYear is required.`,
    "Return JSON: {\"events\":[{\"year\":1969,\"month\":7,\"day\":20,\"endYear\":null,\"title\":\"Apollo 11 landing\",\"summary\":\"...\",\"significance\":5,\"projected\":false}]}",
  ].join("\n");

  const payload = await xaiChatJson({
    apiKey: options.apiKey,
    system: SYSTEM_PROMPT,
    user,
  });

  return parseGeneratedEvents(
    payload,
    options.category,
    options.window,
    options.granularity,
  );
}

export const historyGenerateModel = XAI_CHAT_MODEL;
