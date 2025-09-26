import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { usageEvents } from "@/db/schema";

// Ensure Node runtime (not edge)
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { accountId, eventName, quantity = 1 } = await req.json();

  if (!accountId || !eventName) {
    return NextResponse.json(
      { error: "accountId and eventName required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const inserted = await db
    .insert(usageEvents)
    .values({ accountId, eventName, quantity })
    .returning();

  return NextResponse.json({ ok: true, inserted });
}

export async function GET() {
  const db = await getDb();
  const rows = await db.select().from(usageEvents).limit(100);
  return NextResponse.json(rows);
}
