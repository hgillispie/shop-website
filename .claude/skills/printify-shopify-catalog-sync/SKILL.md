---
name: printify-shopify-catalog-sync
description: How Printify's official Shopify app syncs products into this store's catalog, and why a synced product can still be invisible on /store via the Storefront API even though it's "active." Use when new/updated Printify products aren't showing up on the site, when diagnosing an empty or stale product list from lib/shopify/storefront.ts, or when explaining the Printify → Shopify → Headless pipeline to the owner.
---

# Printify → Shopify → Headless catalog sync

This project (see `docs/shopify-migration-plan.md`) gets its merch catalog from
Printify's **official Shopify app**, not a direct Printify API integration
(that direct integration was removed — see `[[project_shopify_migration]]`
memory / git history around commit `ba88755`). The app:

- Syncs designs from Printify into Shopify as real products/variants
  automatically once connected.
- Keeps inventory/variant availability in sync going forward.
- Auto-fulfills orders once Shopify marks them paid (sends the order to the
  right print provider) — this is *why* the migration plan removed the old
  custom Printify-webhook-driven fulfillment code entirely; there's nothing
  left for our own backend to do for merch fulfillment.

## The gotcha: "active" ≠ "visible on this channel"

Shopify products are published per **sales channel** (each channel has its
own `Publication`). A product can have `status: ACTIVE` and still be
completely invisible to a specific channel's storefront/API — including our
own — until it's explicitly published to *that* channel's publication.
Confirmed directly from Shopify's own current docs/changelog, not assumed:
channel publication state is tracked separately from product status.

This project's storefront queries Shopify's **Storefront API through the
Headless channel** (see `[[shopify-api-auth]]` for the token/header
mechanics). If Printify's app is only configured to auto-publish new
products to, say, the default **Online Store** channel — and not to
**Headless** — then a brand-new Printify product can sync into Shopify,
look completely normal in the Shopify admin, and still return nothing from
`lib/shopify/storefront.ts`'s `getProducts()`. This is the single most likely
explanation for "I added a product in Printify and it's not showing up on
the site."

## Where to actually check/fix this

Printify has its own **"selective publishing" setting for sales channels**
(Printify's connection settings for the Shopify store) that controls which
channels a synced product auto-publishes to. The specific UI location wasn't
directly confirmed in this pass (Printify's help article 403'd when fetched
programmatically) — when this actually comes up, have the owner check
Printify's Shopify connection/publishing settings for a per-channel toggle
and confirm **Headless** is checked, not just Online Store. If it's missing
there, the fallback is publishing the product to the Headless channel
directly from Shopify's own admin (Product → Sales channels and apps →
add Headless), or via the Admin API's `publishablePublish` mutation.

## When debugging "products missing from /store"

1. Check the product's status in Shopify admin (`ACTIVE`, not draft/archived).
2. Check *which channels* it's published to — specifically whether
   **Headless** is one of them, not just Online Store.
3. Only then suspect the Storefront API query itself (wrong token, wrong
   `first`/pagination, a filter excluding it) — channel-publication is the
   more common cause and the cheaper thing to rule out first.
