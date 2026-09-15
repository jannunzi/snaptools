import type { Collection, Db } from "mongodb";
import {
  type HistoryCategoryId,
  type HistoryEvent,
  type HistoryGranularity,
  type HistoryWindow,
  windowKey,
} from "@/lib/history-timeline";
import { getMongoDb } from "@/lib/mongodb";

export const HISTORY_WINDOWS_COLLECTION = "history_event_windows";

export type CachedHistoryWindow = {
  key: string;
  category: HistoryCategoryId;
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
  category: HistoryCategoryId,
  granularity: HistoryGranularity,
  windows: HistoryWindow[],
) {
  const db = await getMongoDb();
  if (!db || windows.length === 0) {
    return new Map<string, CachedHistoryWindow>();
  }

  const starts = windows.map((window) => window.start);
  const collection = await windowsCollection(db);
  const rows = await collection
    .find({ category, granularity, windowStart: { $in: starts } })
    .toArray();

  return new Map(rows.map((row) => [row.key, row]));
}

export async function saveGeneratedWindow(input: {
  category: HistoryCategoryId;
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
