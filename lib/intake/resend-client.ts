import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

export function getIntakeResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export function verifyResendWebhook(rawBody: string, request: Request): unknown {
  const resend = getIntakeResend();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!resend || !secret) {
    throw new Error("Resend webhook is not configured.");
  }

  return resend.webhooks.verify({
    payload: rawBody,
    headers: {
      id: request.headers.get("svix-id") ?? request.headers.get("webhook-id") ?? "",
      timestamp:
        request.headers.get("svix-timestamp") ??
        request.headers.get("webhook-timestamp") ??
        "",
      signature:
        request.headers.get("svix-signature") ??
        request.headers.get("webhook-signature") ??
        "",
    },
    webhookSecret: secret,
  });
}
