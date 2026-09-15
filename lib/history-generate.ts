import {
  eventId,
  formatYearRange,
  GRANULARITY,
  getCategory,
  NOW_YEAR,
  type HistoryCategoryId,
  type HistoryEvent,
  type HistoryGranularity,
  type HistoryWindow,
} from "@/lib/history-timeline";
import { XAI_CHAT_MODEL, xaiChatJson } from "@/lib/xai";

const SYSTEM_PROMPT = [
  "You are a careful historian writing captions for a horizontal world-history timeline.",
  "Return only JSON of the form {\"events\":[...]} with no markdown.",
  "Each event must include: year (integer; negative = BCE), optional endYear, title, summary, significance (1-5), projected (boolean).",
  "Be accurate. Prefer conventional scholarly dates. Do not invent fake day-level precision.",
  "If the window is after the present year, mark projected true and write cautious forecasts, not science fiction.",
  "No mythology presented as fact. No copyrighted long quotations. One or two sentences per summary.",
  "Titles stay short. Events must belong to the requested category and fall inside the year window.",
].join(" ");

function clampSignificance(value: unknown): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(Number(value));
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 4;
  return 5;
}

function asYear(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function parseGeneratedEvents(
  payload: unknown,
  category: HistoryCategoryId,
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
    const year = asYear(row.year);
    if (year === null) continue;
    if (year < window.start - slack || year >= window.end + slack) continue;

    const title = String(row.title ?? "").trim().slice(0, 80);
    const summary = String(row.summary ?? "").trim().slice(0, 280);
    if (!title || !summary) continue;

    const endYearRaw = asYear(row.endYear);
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

export async function generateHistoryWindow(options: {
  apiKey: string;
  category: HistoryCategoryId;
  granularity: HistoryGranularity;
  window: HistoryWindow;
  knownTitles: string[];
}): Promise<HistoryEvent[]> {
  const spec = GRANULARITY[options.granularity];
  const category = getCategory(options.category);
  const known = options.knownTitles.slice(0, 16).join("; ") || "none";

  const user = [
    `Category: ${category.label} — ${category.hint}`,
    `Window: ${formatYearRange(options.window.start, options.window.end)} (start inclusive, end exclusive).`,
    `Granularity: ${options.granularity}. Aim for ${spec.targetCount} distinct events at this resolution.`,
    `Present year: ${NOW_YEAR}. Years after that are forecasts.`,
    `Do not repeat these already-shown titles: ${known}.`,
    "Return JSON: {\"events\":[{\"year\":1440,\"endYear\":null,\"title\":\"...\",\"summary\":\"...\",\"significance\":5,\"projected\":false}]}",
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
