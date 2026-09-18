import type { Collection, Db } from "mongodb";
import { eventFitsCategory } from "@/lib/history-fit";
import {
  type HistoryEvent,
  type HistoryGranularity,
  type HistoryWindow,
  type TimelineCategoryId,
  windowKey,
} from "@/lib/history-timeline";
import { getMongoDb } from "@/lib/mongodb";

export const HISTORY_WINDOWS_COLLECTION = "history_event_windows";

export type CachedHistoryWindow = {
  key: string;
  category: TimelineCategoryId;
  granularity: HistoryGranularity;
  windowStart: number;
  windowEnd: number;
  events: HistoryEvent[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
};

export const HISTORY_WINDOW_INDEXES = [
  {
    name: "category_granularity_window",
    key: { category: 1, granularity: 1, windowStart: 1 },
    unique: true,
  },
  {
    name: "window_key",
    key: { key: 1 },
    unique: true,
  },
] as const;

let indexesReady: Promise<void> | null = null;

async function windowsCollection(db: Db) {
  const collection: Collection<CachedHistoryWindow> = db.collection(
    HISTORY_WINDOWS_COLLECTION,
  );
  if (!indexesReady) {
    indexesReady = Promise.all(
      HISTORY_WINDOW_INDEXES.map((index) =>
        collection.createIndex(index.key, {
          name: index.name,
          unique: index.unique,
        }),
      ),
    ).then(() => undefined);
  }
  try {
    await indexesReady;
  } catch {
    indexesReady = null;
  }
  return collection;
}

export async function loadCachedWindows(
  category: TimelineCategoryId,
  granularity: HistoryGranularity,
  windows: HistoryWindow[],
) {
  const db = await getMongoDb();
  if (!db || windows.length === 0) {
    return new Map<string, CachedHistoryWindow>();
  }

  const keys = windows.map((window) =>
    windowKey(category, granularity, window.start),
  );
  const collection = await windowsCollection(db);
  const rows = await collection.find({ key: { $in: keys } }).toArray();

  return new Map(rows.map((row) => [row.key, row]));
}

export async function saveGeneratedWindow(input: {
  category: TimelineCategoryId;
  granularity: HistoryGranularity;
  window: HistoryWindow;
  events: HistoryEvent[];
  model: string;
}) {
  const db = await getMongoDb();
  if (!db) return null;

  const now = new Date();
  const key = windowKey(input.category, input.granularity, input.window.start);
  const doc: CachedHistoryWindow = {
    key,
    category: input.category,
    granularity: input.granularity,
    windowStart: input.window.start,
    windowEnd: input.window.end,
    events: input.events,
    model: input.model,
    createdAt: now,
    updatedAt: now,
  };

  const collection = await windowsCollection(db);
  await collection.updateOne(
    { key },
    {
      $set: {
        events: doc.events,
        model: doc.model,
        updatedAt: now,
        category: doc.category,
        granularity: doc.granularity,
        windowStart: doc.windowStart,
        windowEnd: doc.windowEnd,
      },
      $setOnInsert: { createdAt: now, key },
    },
    { upsert: true },
  );
  return doc;
}

/**
 * Pull retired seed ids out of cached windows so stale Rome captions
 * do not keep rendering next to the corrected seed bars.
 */
export async function purgeRetiredHistoryEvents(
  ids: string[],
  titles: string[] = [],
) {
  const db = await getMongoDb();
  if (!db || (ids.length === 0 && titles.length === 0)) return 0;

  const collection = await windowsCollection(db);
  const now = new Date();
  let modified = 0;

  if (ids.length > 0) {
    const result = await collection.updateMany(
      { "events.id": { $in: ids } },
      {
        $pull: { events: { id: { $in: ids } } },
        $set: { updatedAt: now },
      },
    );
    modified += result.modifiedCount;
  }

  if (titles.length > 0) {
    const result = await collection.updateMany(
      { "events.title": { $in: titles } },
      {
        $pull: { events: { title: { $in: titles } } },
        $set: { updatedAt: now },
      },
    );
    modified += result.modifiedCount;
  }

  return modified;
}

/**
 * Drop battles/sieges that were generated into Empires windows, and any
 * event whose stamped category does not match the window.
 */
export async function purgeMisfitCachedEvents(
  category: TimelineCategoryId = "empires",
) {
  const db = await getMongoDb();
  if (!db) return 0;

  const collection = await windowsCollection(db);
  const rows = await collection.find({ category }).toArray();
  const now = new Date();
  let modified = 0;

  for (const row of rows) {
    const next = row.events.filter((event) =>
      eventFitsCategory(event, category),
    );
    if (next.length === row.events.length) continue;
    await collection.updateOne(
      { key: row.key },
      { $set: { events: next, updatedAt: now } },
    );
    modified += 1;
  }

  return modified;
}

/**
 * Drop thin AI-filled BCE windows so a richer seed + prompt can refill them.
 * Only touches the SnapTools `history_event_windows` collection (never web-dev).
 */
let thinAncientPurge: Promise<number> | null = null;

export async function purgeThinAncientCachedWindows() {
  if (thinAncientPurge) return thinAncientPurge;
  thinAncientPurge = (async () => {
    const db = await getMongoDb();
    if (!db) return 0;
    const collection = await windowsCollection(db);
    try {
      const result = await collection.deleteMany({
        windowStart: { $lt: 1 },
        $expr: {
          $lt: [{ $size: { $ifNull: ["$events", []] } }, 4],
        },
      });
      return result.deletedCount ?? 0;
    } catch {
      thinAncientPurge = null;
      return 0;
    }
  })();
  return thinAncientPurge;
}
