// scripts/register-printify-webhook.mjs
//
// One-time setup: registers the Printify webhooks this app handles
// (order:sent-to-production, order:shipment:created, product:publish:started)
// against a URL. If this has already been run once for the order topics
// and you're only adding product:publish:started later, either check
// GET /shops/{shop_id}/webhooks.json first or trim this file's `topics`
// array down to just the new one — re-POSTing an already-registered topic
// creates a second, duplicate subscription rather than replacing it.
//
// product:publish:started matters because Printify locks a product
// (is_locked: true, dashboard edit/delete disabled) the instant anything
// calls POST .../publish.json on it, and leaves it locked indefinitely
// until something calls publishing_succeeded or publishing_failed —
// there's no automatic timeout. This app never has a legitimate reason to
// publish a product to an external channel (see reportPublishingFailed in
// lib/printify.ts), so subscribing here is what lets the webhook handler
// auto-release that lock if publish ever gets triggered by anything other
// than this app's own code (e.g. a diagnostic script, or the owner
// clicking Publish in their own Printify dashboard) instead of a product
// silently sitting locked until someone notices.
//
// Only ever run this against the real production URL — Printify has no
// sandbox, and a webhook pointed at localhost or a preview deployment will
// never receive anything real.
//
// Usage: node scripts/register-printify-webhook.mjs https://swaffordspeed.com
//
// Env vars required (loaded from .env.local, same as drizzle.config.ts):
//   PRINTIFY_API_TOKEN
//   PRINTIFY_SHOP_ID
//   PRINTIFY_WEBHOOK_SECRET

import { config } from "dotenv";
config({ path: ".env.local" });

const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error("Usage: node scripts/register-printify-webhook.mjs <site-url>");
  process.exit(1);
}

const token = process.env.PRINTIFY_API_TOKEN;
const shopId = process.env.PRINTIFY_SHOP_ID;
const secret = process.env.PRINTIFY_WEBHOOK_SECRET;

if (!token || !shopId || !secret) {
  console.error("PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID, and PRINTIFY_WEBHOOK_SECRET must all be set in .env.local");
  process.exit(1);
}

const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/store/webhooks/printify`;
const topics = [
  "order:sent-to-production",
  "order:shipment:created",
  "product:publish:started",
];

for (const topic of topics) {
  const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/webhooks.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "swafford-speed-store",
    },
    body: JSON.stringify({ topic, url: webhookUrl, secret }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`Failed to register "${topic}":`, res.status, body);
    continue;
  }
  console.log(`Registered "${topic}" ->`, webhookUrl);
}
