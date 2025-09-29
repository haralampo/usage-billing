import "dotenv/config";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { accounts, pricingTiers } from "../src/db/schema";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const db = drizzle(client);

  // Upsert a demo account
  const email = "demo@local.test";
  const [existingAcc] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);

  const acc =
    existingAcc ??
    (await db.insert(accounts).values({ email }).returning())[0];

  // Upsert a simple pricing tier
  const metric = "ai_summary";
  const [existingTier] = await db
    .select()
    .from(pricingTiers)
    .where(eq(pricingTiers.metric, metric))
    .limit(1);

  const tier =
    existingTier ??
    (await db
      .insert(pricingTiers)
      .values({ metric, unitPriceCents: 1, currency: "usd" })
      .returning())[0];

  console.log("Seeded:", { accountId: acc.id, pricingTierId: tier.id });

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
