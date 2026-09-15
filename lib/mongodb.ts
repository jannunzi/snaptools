import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  _snaptoolsMongo?: Promise<MongoClient>;
};

export function getMongoUri() {
  const uri =
    process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim() || "";
  return uri || null;
}

const COURSE_DB_NAME = "web-dev";
const DEFAULT_DB_NAME = "snaptools";

function usableDbName(name: string | undefined) {
  const trimmed = name?.trim() ?? "";
  if (!trimmed || trimmed === COURSE_DB_NAME) return null;
  return trimmed;
}

export function getMongoDbName() {
  const explicit = usableDbName(process.env.MONGODB_DB);
  if (explicit) return explicit;

  const uri = getMongoUri();
  if (uri) {
    try {
      const pathname = new URL(uri).pathname.replace(/^\//, "");
      const fromUri = usableDbName(pathname.split("?")[0]);
      if (fromUri) return fromUri;
    } catch {
      // Fall through to the SnapTools database.
    }
  }
  return DEFAULT_DB_NAME;
}

export async function getMongoClient() {
  const uri = getMongoUri();
  if (!uri) return null;

  if (!globalForMongo._snaptoolsMongo) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 4000,
    });
    globalForMongo._snaptoolsMongo = client.connect();
  }

  try {
    return await globalForMongo._snaptoolsMongo;
  } catch (error) {
    globalForMongo._snaptoolsMongo = undefined;
    throw error;
  }
}

export async function getMongoDb(): Promise<Db | null> {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(getMongoDbName());
}
