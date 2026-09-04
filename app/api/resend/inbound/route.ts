import { NextResponse } from "next/server";
import { processReceivedEmail } from "@/lib/intake/process-email";
import { verifyResendWebhook } from "@/lib/intake/resend-client";

export const runtime = "nodejs";
export const maxDuration = 60;

type ReceivedEvent = {
  type?: string;
  data?: { email_id?: string };
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  let event: ReceivedEvent;
  try {
    const verified = verifyResendWebhook(rawBody, request);
    event = (typeof verified === "string" ? JSON.parse(verified) : verified) as ReceivedEvent;
  } catch (error) {
    console.warn("[intake webhook] invalid signature:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ ok: true, skipped: "not an inbound email" });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
  }

  try {
    const result = await processReceivedEmail(emailId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[intake webhook] failed to process email", emailId, error);
    return NextResponse.json({ error: "Failed to process inbound email" }, { status: 500 });
  }
}
