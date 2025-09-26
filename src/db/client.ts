import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let connected: Promise<void> | null = null;

export async function getDb() {
  if (!connected) {
    connected = client.connect().then(() => {});
  }
  await connected;
  return drizzle(client);
}
