---
name: shopify-api-auth
description: The exact, verified authentication mechanics for this project's two Shopify API surfaces (Storefront API for /store, Admin API for repair-invoice Draft Orders) — env var names, request headers, and token lifetimes. Use when writing or debugging any code in lib/shopify/*, when a Shopify API call returns 401/UNAUTHORIZED, or when setting up Shopify credentials in .env.local.
---

# Shopify API auth — verified mechanics (not docs guesses)

This project talks to Shopify on two completely separate credentials, each
with its own auth flow. Both were confirmed against Shopify's real API
directly (live calls, not documentation summaries) after several wrong
guesses — see `[[project_shopify_migration]]` memory for the full story if
curious. The two flows do not mix; using the wrong header/flow for either
one fails as a clean 401 with no other hint.

## Storefront API (public catalog + cart — `/store`)

- Env: `SHOPIFY_STORE_DOMAIN` (e.g. `xxxx.myshopify.com`),
  `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (the **private** token).
- Get the token from: Shopify admin → Sales channels → install the
  **Headless** channel → **Create storefront** → copy the **private**
  access token (not the public one — public is for client-side/browser use,
  which this app never does; all Storefront calls happen server-side).
- **The token is issued in the current `shpat_...`-prefixed format, same
  prefix family as Admin API tokens.** Prefix is NOT a reliable way to tell
  Storefront vs. Admin tokens apart anymore — don't infer token type from
  its prefix.
- Endpoint: `POST https://{domain}/api/{version}/graphql.json`
- **Required header:** `Shopify-Storefront-Private-Token: {token}`.
  **NOT** `X-Shopify-Storefront-Access-Token` — that's the older header
  name still shown in a lot of tutorials/docs, and it silently 401s a
  `shpat_`-style private token with no indication the header itself is the
  problem. This exact mistake cost a long debugging cycle in this project —
  if a Storefront call 401s, check the header name before anything else.
- No expiry — this token is long-lived, no refresh logic needed.

## Admin API (repair-invoice Draft Orders — Task 2)

- Env: `SHOPIFY_DEV_APP_CLIENT_ID`, `SHOPIFY_DEV_APP_CLIENT_SECRET`.
- These come from a **custom app created via Shopify's Dev Dashboard**
  (not the old admin-created "Settings > Apps > Develop apps" flow —
  deprecated for new apps as of Jan 1 2026). Real click path:
  1. Dev Dashboard → Create app → Start from Dev Dashboard → name it.
  2. **Versions tab** → App URL (default placeholder
     `https://shopify.dev/apps/default-app-home` is correct for a
     non-embedded, API-only app) → pick a Webhooks API version → enter
     scopes by name (this project uses `write_draft_orders` + `read_orders`
     only) → **Release**.
  3. **Home** tab → scroll down → **Install app** → select the store
     (the *same* store the Headless channel/Storefront token above is on)
     → **Install**.
  4. Settings tab → Client ID / Client secret. **There is no permanent
     `shpat_...` token displayed anywhere for this app type** — that's the
     legacy admin-created-app behavior and does not apply here.
- **This app has no static bearer token at all.** Every real Admin API call
  needs a fresh access token obtained via the OAuth **client credentials
  grant**, done in code:
  ```
  POST https://{shop}.myshopify.com/admin/oauth/access_token
  Content-Type: application/x-www-form-urlencoded
  body: client_id={id}&client_secret={secret}&grant_type=client_credentials
  ```
  Response: `{ access_token, expires_in: 86399, scope: "write_draft_orders,read_orders" }`.
  Token is valid ~24h — cache it in memory and re-fetch a little before it
  expires (this is what `lib/shopify/admin.ts`'s token cache does; don't
  re-fetch on every call, but don't assume it's valid forever either).
- Use the returned `access_token` as the `X-Shopify-Access-Token` header on
  actual Admin API calls (`POST https://{shop}.myshopify.com/admin/api/{version}/graphql.json`).
- `SHOPIFY_WEBHOOK_SECRET` is the **same value as `SHOPIFY_DEV_APP_CLIENT_SECRET`**
  — Shopify signs webhook payloads (HMAC-SHA256) with the app's client
  secret, not with the short-lived access token. Kept as its own env var
  purely so call sites read clearly, not because it's a different value.

## Quick sanity check when something's wrong

Don't guess — run a live check. A minimal read-only probe (Storefront:
`{ shop { name } }` with the private-token header; Admin: the client
credentials POST, then `{ orders(first: 1) { edges { node { id } } } }`
with the returned token) will immediately show which side is broken and
distinguish "bad credential" from "right credential, wrong header/endpoint."
