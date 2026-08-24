// One-off setup script — mirrors scripts/hash-password.mjs's plain-.mjs
// convention (no @/ path aliases available outside Next's own build).
// Registers the orders/paid webhook subscription (Task 2) against a real,
// Shopify-reachable HTTPS URL. Run once per environment; re-running is
// harmless (Shopify just gets a second subscription for the same topic —
// check the Dev Dashboard's app > Webhooks tab if that's ever a concern).
//
// Usage:
//   node scripts/register-shopify-webhook.mjs https://swaffordspeed.com/api/shopify/webhooks/orders-paid
//
// For local testing, Shopify needs a real HTTPS URL it can reach — use a
// tunnel (ngrok, Cloudflare Tunnel, etc.) and pass its https:// URL here,
// not localhost.

import { config } from "dotenv";
config({ path: ".env.local" });

const callbackUrl = process.argv[2] ?? `${process.env.NEXT_PUBLIC_SITE_URL}/api/shopify/webhooks/orders-paid`;

if (!callbackUrl || callbackUrl.includes("localhost")) {
  console.error(
    "Refusing to register a localhost callback URL — Shopify can't reach it.\n" +
      "Pass a real HTTPS URL: node scripts/register-shopify-webhook.mjs https://your-tunnel-or-domain/api/shopify/webhooks/orders-paid",
  );
  process.exit(1);
}

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const clientId = process.env.SHOPIFY_DEV_APP_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_DEV_APP_CLIENT_SECRET;

for (const [name, value] of Object.entries({
  SHOPIFY_STORE_DOMAIN: domain,
  SHOPIFY_DEV_APP_CLIENT_ID: clientId,
  SHOPIFY_DEV_APP_CLIENT_SECRET: clientSecret,
})) {
  if (!value) {
    console.error(`${name} is not set in .env.local`);
    process.exit(1);
  }
}

async function getAccessToken() {
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function main() {
  console.log(`Registering orders/paid webhook -> ${callbackUrl}`);
  const token = await getAccessToken();

  const res = await fetch(`https://${domain}/admin/api/2025-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: `
        mutation RegisterOrdersPaid($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
            webhookSubscription { id topic callbackUrl }
            userErrors { field message }
          }
        }
      `,
      variables: {
        topic: "ORDERS_PAID",
        webhookSubscription: { callbackUrl, format: "JSON" },
      },
    }),
  });

  const json = await res.json();
  const result = json?.data?.webhookSubscriptionCreate;

  if (!res.ok || json.errors || result?.userErrors?.length) {
    console.error("FAILED to register webhook:");
    console.error(JSON.stringify(json.errors ?? result?.userErrors ?? json, null, 2));
    process.exit(1);
  }

  console.log("SUCCESS — webhook subscription created:");
  console.log(JSON.stringify(result.webhookSubscription, null, 2));
}

main().catch((error) => {
  console.error("FAILED:", error.message);
  process.exit(1);
});
