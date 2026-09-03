import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { analyticsEvents } from "@/lib/db/schema";
import { getClientIp } from "@/lib/ip-rules";

// Anything not on this list is dropped, so a scraped endpoint can't fill the
// table with arbitrary strings.
const ALLOWED = new Set([
  "booking_start",
  "booking_step",
  "booking_back",
  "booking_submit",
  "booking_error",
  "booking_complete",
  "hero_start_submit",
  "call_click",
  "store_click",
]);

export async function POST(request: Request) {
  let body: {
    name?: string;
    path?: string;
    sessionId?: string;
    meta?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = String(body.name ?? "");
  if (!ALLOWED.has(name)) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await db.insert(analyticsEvents).values({
      name,
      path: body.path ? String(body.path).slice(0, 500) : null,
      sessionId: body.sessionId ? String(body.sessionId).slice(0, 64) : null,
      meta: body.meta && typeof body.meta === "object" ? body.meta : null,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
  } catch (error) {
    console.error("[api/analytics/event] failed to record:", error);
  }

  // Always 200 — matches the pageview endpoint. Analytics must never surface
  // an error to the visitor, and this table may not exist yet.
  return NextResponse.json({ ok: true });
}
