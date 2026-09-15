/**
 * Create MongoDB indexes for History Timeline window cache.
 *
 *   MONGODB_URI=... npm run history:indexes
 *
 * Safe to re-run. Parent can also skip this: the API ensures the same
 * indexes on first successful connection.
 */
import { MongoClient } from "mongodb";

const INDEXES = [
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
];

const uri = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();
if (!uri) {
  console.error(
    "MONGODB_URI (or MONGO_URI) is missing. Add it to .env.local or the environment.",
  );
  process.exit(1);
}

let dbName = process.env.MONGODB_DB?.trim() || "";
if (!dbName) {
  try {
    dbName = new URL(uri).pathname.replace(/^\//, "").split("?")[0] || "snaptools";
  } catch {
    dbName = "snaptools";
  }
}

const client = new MongoClient(uri);
await client.connect();
const collection = client.db(dbName).collection("history_event_windows");

for (const index of INDEXES) {
  const name = await collection.createIndex(index.key, {
    name: index.name,
    unique: index.unique,
  });
  console.log(`ensured index ${name}`);
}

await client.close();
console.log(`indexes ready on ${dbName}.history_event_windows`);
