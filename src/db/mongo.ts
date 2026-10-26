import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

const globalForMongo = globalThis as typeof globalThis & { mongoClient?: MongoClient; mongoPromise?: Promise<MongoClient> };
const client = globalForMongo.mongoClient ?? new MongoClient(uri || "mongodb://127.0.0.1:27017");
if (process.env.NODE_ENV !== "production") globalForMongo.mongoClient = client;
async function connect() {
  globalForMongo.mongoPromise ??= client.connect();
  return globalForMongo.mongoPromise;
}

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("MongoDB is not configured. Add MONGODB_URI to the server environment.");
  const connected = await connect();
  return connected.db(process.env.MONGODB_DATABASE || "clairovid");
}

export function getAuthDb(): Db {
  return client.db(process.env.MONGODB_DATABASE || "clairovid");
}
