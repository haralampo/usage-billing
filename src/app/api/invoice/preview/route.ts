// src/app/api/invoice/preview/route.ts
import { NextResponse } from "next/server";
import { computeInvoicePreview } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const accountId = Number(searchParams.get("accountId") ?? "");
  if (!Number.isFinite(accountId)) {
    return NextResponse.json(
      { error: "accountId (number) required" },
      { status: 400 }
    );
  }

  const endStr = searchParams.get("end");   // ISO string optional
  const startStr = searchParams.get("start");

  const periodEnd = endStr ? new Date(endStr) : new Date();
  const periodStart = startStr
    ? new Date(startStr)
    : new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  const preview = await computeInvoicePreview(accountId, periodStart, periodEnd);
  return NextResponse.json(preview);
}
