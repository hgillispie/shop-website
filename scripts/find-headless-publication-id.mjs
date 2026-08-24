// One-off lookup — mirrors scripts/hash-password.mjs's plain-.mjs
// convention. Prints every sales channel Publication on the store so you
// can find the Headless channel's id for SHOPIFY_HEADLESS_PUBLICATION_ID
// in .env.local. Needs the read_publications scope granted on top of this
// app's existing scopes (see .env.example).
//
// Usage: node scripts/find-headless-publication-id.mjs

import { config } from "dotenv";
config({ path: ".env.local" });

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
  const token = await getAccessToken();

  const res = await fetch(`https://${domain}/admin/api/2025-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: `{ publications(first: 20) { edges { node { id name } } } }`,
    }),
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    console.error("FAILED:", JSON.stringify(json.errors ?? json, null, 2));
    console.error(
      "\nIf this is a permissions error, confirm read_publications is in this app's " +
        "released scopes AND has been approved (Shopify admin > Settings > Apps > open this app).",
    );
    process.exit(1);
  }

  console.log("Sales channel publications on this store:\n");
  for (const { node } of json.data.publications.edges) {
    console.log(`${node.name.padEnd(20)} ${node.id}`);
  }
  console.log("\nCopy the Headless one's id into SHOPIFY_HEADLESS_PUBLICATION_ID in .env.local.");
}

main().catch((error) => {
  console.error("FAILED:", error.message);
  process.exit(1);
});
