# Project Context — Swafford Speed

Quick orientation for picking up this repo cold. Companions: [`INTEGRATIONS.md`](./INTEGRATIONS.md) (third-party service quick-facts — read before touching Shopify/Resend/Twilio code) and [`OPERATIONS.md`](./OPERATIONS.md) (deploy steps, env vars, known gotchas — read before deploying).

**This is live production** (`swaffordspeed.com`, branch `main`), not a sandbox — real customers, real owner. When unsure whether something is safe/live/current, check `git log`/current code or ask, rather than assuming.

## Stack
Next.js 16 App Router + TS + Tailwind v4 + React 19 · Neon Postgres via Drizzle (`neon-http` — **no transactions**, sequential writes only) · Resend (email, including inbound screenshot intake) · Telegram bot (screenshot intake) · Groq Llama 4 Scout (vision OCR) · Twilio (SMS, currently paused via `SMS_ENABLED=false`) · Vercel Blob (photo uploads) · Shopify (storefront + repair-invoice payments) · hosted on Vercel.

**AGENTS.md says "this is NOT the Next.js you know" — real, not decoration.** Conventions have shifted (favicon/icon files, `next/script`, `middleware`→`proxy`). Check `node_modules/next/dist/docs/` for anything Next-API-shaped rather than assuming from training data.

## Branches
- `main` — production, auto-deploys (usually — see OPERATIONS.md).
- `feature/shopify-migration` — fully merged into `main`, nothing missing. Safe to ignore.
- `feature/store` — abandoned earlier e-commerce attempt (Stripe+Printify direct, no Shopify). Superseded, not live. Don't resurrect without asking.

## Routes (high level — read the actual file for specifics)
- `/`, `/privacy`, `/terms` — marketing/static.
- `/store`, `/store/products/[handle]`, `/store/cart` — Shopify-backed storefront. **`/store` degrades to an empty-state on API failure that looks identical to "no products" from outside** — if debugging an empty store, check actual content/env vars, not just HTTP status.
- `/admin/*` — session-gated by `middleware.ts` (cookie + `jose` JWT). Requests inbox, CRM, Kanban board, calendar, analytics, repair invoices (+ PDF stream + print view).
- `/api/appointments`, `/api/analytics/pageview` — public POST endpoints.
- `/api/shopify/webhooks/{orders-paid,products-create}` — HMAC-verified Shopify webhooks.
- `/api/resend/inbound` — Svix-verified Resend `email.received` webhook (screenshot intake).
- `/api/telegram/webhook` — Telegram bot webhook (screenshot intake; `X-Telegram-Bot-Api-Secret-Token`).

## Data model (`lib/db/schema.ts`) — three separate trees, not unified
1. **CRM/booking**: `customers` (health score + Google-review outreach) ← `appointment_requests` / `jobs` (Kanban, including `open_draft`) / `tickets` / `intake_drafts` / `customer_quotes` (verbatim lines for later site use).
2. **Repair invoices**: `service_invoices` → `..._jobs` → `..._parts_lines`. **Deliberately standalone, no FK to customers/jobs** — real decision, not an oversight.
3. **Ops**: `page_views`, `ip_rules`, `admin_users`.

No local table for merch orders — Shopify/Printify own that data entirely.

## Patterns worth knowing before writing code here
- Server Actions (co-located `actions.ts`) do all admin CRUD + cart mutations; each checks session explicitly (not just relying on middleware). Route Handlers only for things called from outside this app's React tree (webhooks, public form POST, PDF stream).
- Email (`lib/email.ts`) all goes through Resend. Two invoice emails + the appointment-confirmation email got a branded HTML redesign (logo + colors `201E1E`/`F58220`/`EC5407`) matching the Shopify checkout's own branding — scoped to just those, not the main site.
- `lib/invoices/pdf.tsx` (`@react-pdf/renderer`) is unrelated to the email rebrand — intentionally still uses the old logo.

## If something here seems off or you're not sure
Ask rather than assume, especially for: which branch is actually current, whether a proposed plan (e.g. `docs/crm-roadmap.md`) has been built yet, whether an env var exists in the environment scope you're about to rely on, and anything payment/credential/DNS-related. See `OPERATIONS.md`'s "Known open items" for the specific known-shaky areas.

## More detail
`docs/shopify-migration-plan.md` (original spec — file names in it are stale), `docs/crm-roadmap.md` (Phase 3B screenshot intake is built; CRM health / quotes / Google-review queue are built), `.claude/skills/shopify-api-auth/`, `.claude/skills/printify-shopify-catalog-sync/`.

## Keeping this current
Skill `update-project-docs` — run it after a *significant* change (new integration, schema change, deploy-process change, a real gotcha discovered, a status flip like proposed→built). Not needed after routine changes. When unsure, ask.
