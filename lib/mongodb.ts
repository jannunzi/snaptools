import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  _snaptoolsMongo?: Promise<MongoClient>;
};

export function getMongoUri() {
  const uri =
    process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim() || "";
  return uri || null;
}

export function getMongoDbName() {
  const explicit = process.env.MONGODB_DB?.trim();
  if (explicit) return explicit;

  const uri = getMongoUri();
  if (!uri) return "snaptools";
  try {
    const pathname = new URL(uri).pathname.replace(/^\//, "");
    const name = pathname.split("?")[0]?.trim();
    return name || "snaptools";
  } catch {
    return "snaptools";
  }
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
