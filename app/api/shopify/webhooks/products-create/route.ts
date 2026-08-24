import { NextResponse } from "next/server";
import { publishProductToHeadless, verifyShopifyWebhook } from "@/lib/shopify/admin";

// Closes the loop the owner asked for: Printify syncs a new product into
// Shopify's catalog -> this fires -> we publish it to the Headless channel
// automatically, instead of someone having to open Shopify admin and add
// each product to Headless by hand. Standing-authorized (see
// lib/shopify/admin.ts's publishProductToHeadless) specifically for
// publishing an already-Printify-synced product — nothing else.
//
// Needs the read_products + write_publications scopes granted on top of
// this app's original write_draft_orders + read_orders (see
// .claude/skills/shopify-api-auth), and SHOPIFY_HEADLESS_PUBLICATION_ID in
// .env.local (see scripts/find-headless-publication-id.mjs).
export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    console.warn("[shopify webhook] invalid signature on products/create delivery");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { id: number | string; title?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productGid = `gid://shopify/Product/${payload.id}`;

  // publishProductToHeadless can throw outright (e.g. SHOPIFY_HEADLESS_
  // PUBLICATION_ID not set yet, or the app's scopes not approved/expanded
  // yet) in addition to returning {ok:false} for a GraphQL-level error —
  // both are "we can't fix this by retrying," so both log and 200 rather
  // than surfacing as a 500 that Shopify would just retry uselessly.
  try {
    const result = await publishProductToHeadless(productGid);
    if (!result.ok) {
      console.error(
        "[shopify webhook] failed to auto-publish product to Headless:",
        payload.id,
        payload.title,
        result.error,
      );
      return NextResponse.json({ ok: true, published: false, error: result.error });
    }
    console.info("[shopify webhook] auto-published to Headless:", payload.id, payload.title);
    return NextResponse.json({ ok: true, published: true });
  } catch (error) {
    console.error(
      "[shopify webhook] publishProductToHeadless threw:",
      payload.id,
      payload.title,
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({
      ok: true,
      published: false,
      error: "publishProductToHeadless threw — check SHOPIFY_HEADLESS_PUBLICATION_ID and app scopes",
    });
  }
}
