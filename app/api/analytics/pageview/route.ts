import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pageViews } from "@/lib/db/schema";
import { getClientIp } from "@/lib/ip-rules";

export async function POST(request: Request) {
  let body: { path?: string; referrer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = String(body.path ?? "").slice(0, 500);
  if (!path) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await db.insert(pageViews).values({
      path,
      referrer: body.referrer ? String(body.referrer).slice(0, 500) : null,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
  } catch (error) {
    console.error("[api/analytics/pageview] failed to record:", error);
  }

  // Always 200 — analytics is best-effort and must never surface an error
  // to the visitor's page.
  return NextResponse.json({ ok: true });
}
