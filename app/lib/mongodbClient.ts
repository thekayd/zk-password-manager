import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "zk-password-manager";

let client: MongoClient;
let db: any;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return { client, db };
}

export async function closeDatabase() {
  if (client) {
    await client.close();
  }
}
