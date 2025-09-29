// src/lib/billing.ts
import { getDb } from "@/db/client";
import { usageEvents, pricingTiers } from "@/db/schema";
import { sql, and, eq, gte, lt } from "drizzle-orm";

type LineItem = {
  metric: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

function eventNameToMetric(eventName: string): string {
  // Simple mapping: strip common suffixes so "ai_summary_generated" -> "ai_summary"
  return eventName.replace(/_(generated|used|event|count)$/i, "");
}

export async function computeInvoicePreview(
  accountId: number,
  periodStart: Date,
  periodEnd: Date
) {
  const db = await getDb();

  // 1) Aggregate usage by eventName within the window
  const aggregates = await db
    .select({
      eventName: usageEvents.eventName,
      quantity: sql<number>`sum(${usageEvents.quantity})`.as("quantity"),
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.accountId, accountId),
        gte(usageEvents.createdAt, periodStart),
        lt(usageEvents.createdAt, periodEnd)
      )
    )
    .groupBy(usageEvents.eventName);

  // 2) Load prices into a map
  const tiers = await db.select().from(pricingTiers);
  const priceMap = new Map(tiers.map((t) => [t.metric, t.unitPriceCents]));

  // 3) Build line items
  const lineItems: LineItem[] = aggregates.map((row) => {
    const metric = eventNameToMetric(row.eventName);
    const unitPriceCents = priceMap.get(metric) ?? 0; // 0 if no tier yet
    const quantity = Number(row.quantity ?? 0);
    return {
      metric,
      unitPriceCents,
      quantity,
      lineTotalCents: unitPriceCents * quantity,
    };
  });

  // 4) Totals
  const subtotalCents = lineItems.reduce((s, li) => s + li.lineTotalCents, 0);
  const taxCents = 0; // add tax calc later if needed
  const totalCents = subtotalCents + taxCents;

  return {
    accountId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    lineItems,
    subtotalCents,
    taxCents,
    totalCents,
  };
}
