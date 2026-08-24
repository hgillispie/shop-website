# Migrate swaffordspeed.com from Stripe/Printify-direct to Shopify (Basic plan)

*(This replaces an earlier prompt built around a Stripe + direct-Printify-API
integration. None of that ever went live — no real orders, no hardware
purchased for it — so treat this as a clean swap, not a careful migration of
live data.)*

## What's changing, at a glance

| Piece | Before (being removed) | After (this plan) |
|---|---|---|
| Merch checkout | Custom Stripe Payment Element, custom DB cart | Shopify-hosted checkout via redirect, Shopify Cart API |
| Product data | Direct Printify REST API calls | Printify's official Shopify app syncs into Shopify's catalog; storefront queries Shopify's Storefront API |
| Order fulfillment | Custom webhook → Printify order creation | Printify's Shopify app auto-fulfills on paid order |
| Merch confirmation email | Resend, triggered from Stripe webhook | Shopify's built-in default confirmation email |
| Pay-by-link repair invoices | Stripe Invoicing/Checkout Sessions (never built) | Shopify Draft Order Admin API, called from existing custom UI |
| In-person payments | Custom Stripe Terminal UI + S700 | Shopify POS app (native) + Tap & Chip reader, no custom code |

## Architecture decisions — settled, don't relitigate

- **Shopify Basic plan** — owner is signing up for this now. Gets 2.9%+30¢
  online, 2.6%+10¢ in-person, no third-party-processor surcharge as long as
  Shopify Payments is the processor everywhere.
- **Printify's official Shopify app** replaces the direct Printify API
  integration. Shopify's hosted checkout needs real Shopify products/variants
  to build a cart around — raw Printify API data alone can't populate it — so
  products need to actually live in Shopify's catalog. The official app
  syncs designs in automatically and also auto-fulfills orders once Shopify
  marks them paid, which also resolves the multi-provider shipping-rate
  problem natively instead of it being hand-rolled.
- **Cart state lives entirely in Shopify's Cart API** — no custom DB-backed
  cart anymore. Keep the on-site cart UI/UX looking and feeling the same as
  what's already built; only the data layer underneath changes.
- **Merch order confirmation: use Shopify's built-in default email.** No
  Resend webhook needed for merch orders specifically (repair invoices are
  different — see Task 2).
- **In-person payments: no custom code at all.** Shopify's card readers
  (Tap & Chip included) only pair with the native Shopify POS app over
  Bluetooth — there's no browser SDK equivalent to Stripe's Terminal JS SDK.
  Going with the **Tap & Chip reader ($49)** — cheaper, same tier as the
  originally-planned M2, and the native-app requirement isn't a downside
  here since there's no way around it either way.
- **`/store` stays its own section of the app**, not a scroll section,
  linked in the Navbar — that architecture decision from before is
  unaffected by this change.

## Task 1: Merch storefront — Shopify-hosted checkout redirect

- Install Printify's official Shopify app from the Shopify App Store,
  connect the existing Printify account, let it sync designs into Shopify's
  product catalog as real products/variants.
- Replace product listing calls: query Shopify's **Storefront API** (GraphQL)
  for products instead of calling Printify's REST API directly. Cache with
  periodic revalidation, same reasoning as before — the catalog changes
  rarely.
- Replace the cart: build against Shopify's **Cart API**
  (`cartCreate` / `cartLinesAdd` / etc.) instead of a DB-backed cart. Keep the
  existing cart UI's look and behavior — this should feel like an
  under-the-hood swap to anyone using the site, not a redesign.
- Checkout: once the customer is ready to pay, redirect the browser to the
  `checkoutUrl` the Cart API returns. That's a genuine Shopify-hosted
  checkout page — Shop Pay, Apple Pay, Google Pay, PayPal all show up there
  natively, no Payment Element or custom payment UI needed on our side
  anymore.
- Confirmation and fulfillment happen automatically once the order is paid:
  Shopify sends its own confirmation email, and Printify's app picks up the
  order for fulfillment. No webhook needs to be built for this specific
  flow.

## Task 2: Pay-by-link repair invoices — Shopify Draft Order API

This is a separate flow from the merch store, driven by the existing custom
invoice-generator UI (customer info, vehicle info, jobs, parts, labor, tied
to the CRM) — none of that UI, the CRM, or the branded PDF changes.

- On submit, in addition to generating the PDF as it does today, call
  Shopify's Admin GraphQL API:
  - `draftOrderCreate` — populate with the same customer info and job data;
    represent parts and labor as line items (custom line items work fine for
    labor, since it isn't real inventory), with tax applied.
  - `draftOrderInvoiceSend` — sends the customer an email with a link to a
    real Shopify checkout page showing that itemized breakdown.
- Subscribe to Shopify's `orders/paid` webhook (a paid draft order becomes a
  regular order) to know when it's been paid. On that event: mark the
  invoice paid in the CRM, and send **our own branded Resend confirmation**
  — unlike the merch flow, keep this one on our own email since it's tied to
  the CRM/branding the owner already uses for repair work.
- This needs its own Shopify Admin API access token (separate concern from
  the public Storefront API token used in Task 1) — treat it like a backend
  secret, never expose it client-side.

## Task 3: In-person payments — hardware + native app, no code

Expected to be the minority flow — most repair-invoice payments will go
through pay-by-link (Task 2), not a walk-up tap. Don't over-invest here.

- Buy a Shopify Tap & Chip Card Reader ($49). No separate receipt printer —
  use Shopify POS's built-in digital receipt (email/text) for these
  occasional in-person payments instead of paper; revisit only if that
  becomes a real friction point in practice.
- Owner installs the free Shopify POS app on a phone or tablet, logs into
  the Shopify account, pairs the reader over Bluetooth from inside that app.
- All in-person transactions happen entirely within Shopify's POS app —
  there is no integration point with the custom website for this at all.
- **Remove**, don't adapt: `stripe-terminal-backend.js`, `TerminalCheckout.jsx`,
  and any work-in-progress on an owner-only admin gate for a Terminal
  route — none of that is needed anymore since there's no custom UI for
  in-person payments to gate in the first place.
- **Two operational gaps worth documenting for the owner, not building
  around in code:**
  - A walk-up sale is a plain custom-amount charge in Shopify POS, entered
    manually — it has no connection back to our backend/CRM the way a paid
    Draft Order does. The owner needs to manually mark the job paid in the
    invoice-generator UI afterward. Worth putting the R.O. number in
    Shopify POS's note/reference field at the time of sale, so the
    transaction is at least traceable later if needed.
  - Watch for double-taxing: the invoice PDF's "Total Due" already includes
    sales tax. If that number is punched into Shopify POS as-is, confirm
    Shopify's own tax settings aren't adding tax on top of it again — pick
    one convention (enter the pre-tax subtotal and let Shopify calculate
    tax, or mark the custom-amount sale as tax-inclusive) and document it
    for whoever's running the register.

## Files/code to remove

- `stripe-checkout-backend.js` (PaymentIntent creation, the
  `payment_intent.succeeded` webhook, the `getOrderByRef()` stub)
- `stripe-terminal-backend.js`
- `CheckoutForm.jsx`
- `TerminalCheckout.jsx`
- `printify-service.js` and `printify-webhook-handler.js` — Printify's
  official Shopify app replaces what these were doing
- Any DB-backed cart storage/schema built specifically for the Stripe flow
- The earlier `claude-code-prompt.md` in this repo, if present — it describes
  the Stripe-based version of this build and is now superseded by this
  document

## Environment / config

**New:**
- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` — public-facing, used for product
  queries and cart operations
- `SHOPIFY_ADMIN_API_ACCESS_TOKEN` — private, backend-only, used for draft
  order creation and invoice sending
- `SHOPIFY_WEBHOOK_SECRET` — to verify the incoming `orders/paid` webhook

**Remove:**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Stripe publishable key
- `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID`, `PRINTIFY_WEBHOOK_SECRET` —
  Printify's Shopify app manages that relationship inside Shopify's own
  admin; no custom credentials needed for it on our side

**Keep as-is:**
- Resend API key/config — still used, just only for the repair-invoice flow
  now, not merch orders

## Prerequisite setup steps (not code — flag these, don't build around them being done)

- Install the Shopify CLI (`npm install -g @shopify/cli@latest`) — use it to
  scaffold the custom app for Admin API access, manage scopes, and handle
  auth, rather than doing all of that by hand through the Shopify admin
  dashboard.
- Shopify Basic plan active
- Printify's official Shopify app installed and connected, catalog synced
- A custom Shopify app created for Admin API access, with the scopes needed
  for draft orders (e.g. `write_draft_orders`, `read_orders`)
- A Storefront API access token generated
- Webhook subscription for `orders/paid` registered, pointing at our backend
- Tap & Chip reader purchased, Shopify POS app installed on whatever device
  the owner will use at the counter

## Out of scope — don't build unless asked

- **This does not mean the existing customer-facing product page.** The page
  that already fetches products, shows variants, and adds to cart stays
  exactly where it is on our own site — see Task 1. It just switches its
  data source from Printify's REST API to Shopify's Storefront API; nothing
  about the page itself, its UX, or where it lives changes.
- What's actually out of scope: an *owner-facing* admin tool for creating,
  editing, or deleting products. Printify's app handles getting products
  into Shopify's catalog; if the owner ever needs to edit a listing, that
  happens in Shopify's or Printify's own dashboard, not a tool we build into
  this app.
- Customer accounts, login, or order history for the storefront.
- Multi-currency or tax handling beyond what Shopify calculates
  automatically.
- Any custom UI, admin gate, or auth system for in-person payments — that
  entire surface is now just the Shopify POS app.

## Worth confirming with me before you build

- Whether `orders/paid` is the right webhook for catching a paid draft order
  specifically, versus a more targeted event — flag if the repo's existing
  webhook-handling pattern (from the old Printify webhook handler) suggests
  a cleaner way to distinguish "repair invoice paid" from "merch order
  paid" if both land on the same webhook topic.
- Whether the Admin API scopes needed for draft orders overlap with
  anything else this app might eventually want from Shopify's Admin API, in
  case it's worth requesting a slightly broader scope now rather than
  re-authorizing later.
