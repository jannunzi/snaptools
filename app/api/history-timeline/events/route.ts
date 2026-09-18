import { NextResponse } from "next/server";
import { ancientWindowTooThin } from "@/lib/history-fill";
import { withoutMisfitEvents } from "@/lib/history-fit";
import {
  loadCachedWindows,
  purgeMisfitCachedEvents,
  purgeRetiredHistoryEvents,
  purgeThinAncientCachedWindows,
  saveGeneratedWindow,
} from "@/lib/history-cache";
import { generateHistoryWindow, historyGenerateModel } from "@/lib/history-generate";
import {
  RETIRED_HISTORY_EVENT_IDS,
  RETIRED_HISTORY_EVENT_TITLES,
  seedEventsFor,
  withoutRetiredHistoryEvents,
} from "@/lib/history-seed";
import {
  clampYear,
  GRANULARITY,
  isHistoryGranularity,
  isTimelineCategory,
  mergeEvents,
  TIMELINE_END,
  TIMELINE_START,
  type HistoryEvent,
  type HistoryGranularity,
  type TimelineCategoryId,
  windowKey,
  windowsOverlapping,
} from "@/lib/history-timeline";
import { getMongoDbName, getMongoUri } from "@/lib/mongodb";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getXaiApiKey } from "@/lib/xai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FILL_LIMIT = 8;
const FILL_WINDOW_MS = 60_000;
const MAX_GENERATE_PER_REQUEST = 3;

type WindowStatus = {
  start: number;
  end: number;
  key: string;
  source: "cache" | "generated" | "seed" | "missing";
};

type ParsedRequest =
  | { ok: false; error: string }
  | {
      ok: true;
      category: TimelineCategoryId;
      categoryLabel?: string;
      granularity: HistoryGranularity;
      start: number;
      end: number;
      fill: boolean;
    };

function readRequest(input: {
  category?: unknown;
  categoryLabel?: unknown;
  start?: unknown;
  end?: unknown;
  granularity?: unknown;
  fill?: unknown;
}): ParsedRequest {
  const categoryRaw = String(input.category ?? "");
  const granularityRaw = String(input.granularity ?? "century");
  const fillRaw = input.fill;
  const fill =
    fillRaw === true ||
    fillRaw === 1 ||
    fillRaw === "1" ||
    fillRaw === "true";
  const categoryLabel = String(input.categoryLabel ?? "").trim().slice(0, 48);

  if (!isTimelineCategory(categoryRaw)) {
    return { ok: false, error: "Unknown category." };
  }
  if (!isHistoryGranularity(granularityRaw)) {
    return { ok: false, error: "Unknown granularity." };
  }

  const start = clampYear(Number(input.start ?? TIMELINE_START));
  const end = clampYear(Number(input.end ?? TIMELINE_END));
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    return { ok: false, error: "Invalid time range." };
  }

  return {
    ok: true,
    category: categoryRaw,
    categoryLabel: categoryLabel || undefined,
    granularity: granularityRaw,
    start,
    end,
    fill,
  };
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function handleEvents(input: ParsedRequest, request: Request) {
  if (!input.ok) return jsonError(input.error, 400);

  const { category, categoryLabel, granularity, start, end, fill } = input;
  const windows = windowsOverlapping(start, end, granularity);
  const spec = GRANULARITY[granularity];
  const apiKey = getXaiApiKey();
  const mongoConfigured = Boolean(getMongoUri());

  let cached = new Map<string, { events: HistoryEvent[] }>();
  let mongo = mongoConfigured;
  if (mongoConfigured) {
    try {
      if (category === "empires") {
        await purgeRetiredHistoryEvents(
          [...RETIRED_HISTORY_EVENT_IDS],
          [...RETIRED_HISTORY_EVENT_TITLES],
        );
        await purgeMisfitCachedEvents("empires");
      }
      await purgeThinAncientCachedWindows();
      cached = await loadCachedWindows(category, granularity, windows);
    } catch {
      mongo = false;
      cached = new Map();
    }
  }

  const statuses: WindowStatus[] = [];
  const collected: HistoryEvent[][] = [];
  const toGenerate: typeof windows = [];

  for (const window of windows) {
    const key = windowKey(category, granularity, window.start);
    const seed = seedEventsFor(category, window.start, window.end);
    const hit = cached.get(key);
    const cachedEvents = hit
      ? withoutMisfitEvents(withoutRetiredHistoryEvents(hit.events), category)
      : [];
    collected.push(cachedEvents);
    collected.push(seed);
    const available = mergeEvents(cachedEvents, seed).length;
    const richThin = ancientWindowTooThin(
      available,
      granularity,
      category,
      window,
    );

    if (hit && !richThin) {
      statuses.push({ ...window, key, source: "cache" });
      continue;
    }
    if (!fill) {
      statuses.push({
        ...window,
        key,
        source: available > 0 ? "seed" : "missing",
      });
      continue;
    }
    // minSeed 0 means "always ask at this zoom" (year / month / week / day).
    // Rich ancient windows still generate when seed+cache is far below target.
    if (spec.minSeed > 0 && seed.length >= spec.minSeed && !richThin) {
      statuses.push({ ...window, key, source: "seed" });
      continue;
    }
    toGenerate.push(window);
  }

  const generateNow = toGenerate.slice(0, MAX_GENERATE_PER_REQUEST);
  const leftover = toGenerate.slice(MAX_GENERATE_PER_REQUEST);
  let generatedCount = 0;

  if (generateNow.length > 0 && !apiKey) {
    for (const window of [...generateNow, ...leftover]) {
      const key = windowKey(category, granularity, window.start);
      const seed = seedEventsFor(category, window.start, window.end);
      statuses.push({
        ...window,
        key,
        source: seed.length > 0 ? "seed" : "missing",
      });
    }
  }

  if (generateNow.length > 0 && apiKey) {
    if (!rateLimit(`history:${clientKey(request)}`, FILL_LIMIT, FILL_WINDOW_MS)) {
      return NextResponse.json(
        {
          error: "Too many timeline fills. Try again in a moment.",
          events: withoutMisfitEvents(
            withoutRetiredHistoryEvents(mergeEvents(...collected)),
            category,
          ),
          windows: [
            ...statuses,
            ...generateNow.map((window) => ({
              ...window,
              key: windowKey(category, granularity, window.start),
              source: "missing" as const,
            })),
            ...leftover.map((window) => ({
              ...window,
              key: windowKey(category, granularity, window.start),
              source: "missing" as const,
            })),
          ],
          meta: {
            mongo,
            xai: true,
            generated: 0,
            cached: cached.size,
            pending: leftover.length,
            database: getMongoDbName(),
          },
        },
        { status: 429 },
      );
    }

    const results = await Promise.allSettled(
      generateNow.map(async (window) => {
        const seed = seedEventsFor(category, window.start, window.end);
        const known = seed.map((event) => event.title);
        const first = await generateHistoryWindow({
          apiKey,
          category,
          categoryLabel,
          granularity,
          window,
          knownTitles: known,
        });
        let events = first;
        const thinAfterFirst = ancientWindowTooThin(
          mergeEvents(first, seed).length,
          granularity,
          category,
          window,
        );
        if (thinAfterFirst) {
          const retry = await generateHistoryWindow({
            apiKey,
            category,
            categoryLabel,
            granularity,
            window,
            knownTitles: [...known, ...first.map((event) => event.title)],
          });
          events = mergeEvents(first, retry);
        }
        const stillThin = ancientWindowTooThin(
          mergeEvents(events, seed).length,
          granularity,
          category,
          window,
        );
        if (events.length > 0 && mongo && !stillThin) {
          try {
            await saveGeneratedWindow({
              category,
              granularity,
              window,
              events,
              model: historyGenerateModel,
            });
          } catch {
            // Serving generated events still succeeds if the cache write fails.
          }
        }
        return { window, events, thin: stillThin };
      }),
    );

    for (const [index, result] of results.entries()) {
      const window = generateNow[index];
      if (!window) continue;
      if (result.status === "fulfilled") {
        collected.push(result.value.events);
        generatedCount += 1;
        statuses.push({
          ...window,
          key: windowKey(category, granularity, window.start),
          source:
            result.value.events.length > 0 && !result.value.thin
              ? "generated"
              : "missing",
        });
        continue;
      }
      const seed = seedEventsFor(category, window.start, window.end);
      statuses.push({
        ...window,
        key: windowKey(category, granularity, window.start),
        source: seed.length > 0 ? "seed" : "missing",
      });
    }
  }

  if (apiKey || generateNow.length === 0) {
    for (const window of leftover) {
      const seed = seedEventsFor(category, window.start, window.end);
      statuses.push({
        ...window,
        key: windowKey(category, granularity, window.start),
        source: seed.length > 0 ? "seed" : "missing",
      });
    }
  }

  return NextResponse.json({
    events: withoutMisfitEvents(
      withoutRetiredHistoryEvents(mergeEvents(...collected)),
      category,
    ),
    windows: statuses.sort((a, b) => a.start - b.start),
    meta: {
      mongo,
      xai: Boolean(apiKey),
      generated: generatedCount,
      cached: cached.size,
      pending: apiKey ? leftover.length : 0,
      database: getMongoDbName(),
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("status") === "1") {
    return NextResponse.json({
      mongo: Boolean(getMongoUri()),
      xai: Boolean(getXaiApiKey()),
      database: getMongoDbName(),
    });
  }

  return handleEvents(
    readRequest({
      category: url.searchParams.get("category"),
      categoryLabel: url.searchParams.get("categoryLabel"),
      start: url.searchParams.get("start"),
      end: url.searchParams.get("end"),
      granularity: url.searchParams.get("granularity"),
      fill: url.searchParams.get("fill"),
    }),
    request,
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  return handleEvents(
    readRequest({
      category: body.category,
      categoryLabel: body.categoryLabel,
      start: body.start,
      end: body.end,
      granularity: body.granularity,
      fill: body.fill,
    }),
    request,
  );
}
