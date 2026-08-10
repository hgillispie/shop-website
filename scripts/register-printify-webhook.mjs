// scripts/register-printify-webhook.mjs
//
// One-time setup: registers the two Printify webhooks this app handles
// (order:sent-to-production, order:shipment:created) against a URL.
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
const topics = ["order:sent-to-production", "order:shipment:created"];

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
