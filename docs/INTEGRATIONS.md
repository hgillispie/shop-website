# Integrations — Swafford Speed

Quick-facts for the third-party services this app talks to. Read the relevant bit before writing code that touches one. Companion: [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md), [`OPERATIONS.md`](./OPERATIONS.md) (deploy/env vars/DNS).

## Shopify (storefront + repair-invoice payments)
- Storefront API: private token, sent as header `Shopify-Storefront-Private-Token` (**not** the classic `X-Shopify-Storefront-Access-Token` — that 401s silently). `lib/shopify/storefront.ts`.
- Admin API: no static token — OAuth client-credentials grant (`POST https://{shop}.myshopify.com/admin/oauth/access_token`), token cached ~24h, auto-refreshed. `lib/shopify/admin.ts`.
- Webhooks: HMAC-SHA256 over the raw body using the app's client secret, header `X-Shopify-Hmac-Sha256`. Register via `node scripts/register-shopify-webhook.mjs <topic> <https-url>` — it only *adds* a subscription, doesn't replace, so re-pointing to a new domain leaves the old one active too (harmless — handlers are idempotent).
- Checkout is 100% Shopify-hosted (`cart.checkoutUrl`) — this app never renders a payment form itself.
- **A product can be `ACTIVE` in Shopify and still invisible via the Storefront API** until published to the Headless channel's specific Publication — see `.claude/skills/printify-shopify-catalog-sync/`.
- Shop Pay's own accelerated-checkout button (`shop.app`) funnels first-time/guest buyers into an account-creation flow before showing any other payment method — deliberately **not** used here; the storefront uses a plain "Buy now" (add to cart → redirect to the neutral `checkoutUrl`) instead, which shows Shop/PayPal/Apple Pay/Google Pay equally.
- Tap to Pay on iPhone (in-store POS) and Apple Pay on the web checkout are **fully independent** — activating one doesn't affect the other.

## Resend (email)
Domain `swaffordspeed.com` is verified for sending. Logo images in HTML emails are base64-inlined, not linked by URL. Inbound: `email.received` webhook → `/api/resend/inbound` (Svix headers, `RESEND_WEBHOOK_SECRET`). Body/attachments are **not** in the webhook — fetch via `emails.receiving.get` + attachments API. Put the MX record on a subdomain (e.g. `inbound.swaffordspeed.com`) so it does not steal existing mail. Allowlist is `OWNER_EMAIL` plus optional `INTAKE_ALLOWED_SENDERS`.

## Telegram (owner screenshot intake)
Bot token `TELEGRAM_BOT_TOKEN`. Webhook `/api/telegram/webhook` verified with `TELEGRAM_WEBHOOK_SECRET` (`X-Telegram-Bot-Api-Secret-Token`). Register with `node scripts/register-telegram-webhook.mjs <https-url>`. Send screenshots as an album so they stay on one Open Draft. Optional `TELEGRAM_ALLOWED_USER_IDS` (from `/start`). Same extract/approve pipeline as Resend inbound.

## Groq (vision OCR)
Llama 4 Scout (`meta-llama/llama-4-scout-17b-16e-instruct`) via the OpenAI-compatible Groq API. Used only for intake screenshots. Skip extraction (still create the draft) if `GROQ_API_KEY` is missing.

## Printify (merch fulfillment)
No direct API integration in this app anymore — fulfillment runs entirely through Printify's own official Shopify app. The only Printify-adjacent code here is the `products/create` webhook, which auto-publishes a newly-synced product to the Headless channel.

## Twilio (SMS)
Paused (`SMS_ENABLED=false`) pending the owner's A2P 10DLC brand registration. Code is correct and ready; don't expect anything to actually send until that flag flips.

## Neon / Vercel Blob
Neon Postgres via Drizzle — see `PROJECT_CONTEXT.md` for the no-transactions constraint. Vercel Blob stores appointment-intake photos and screenshot-intake images (`lib/storage.ts`).
