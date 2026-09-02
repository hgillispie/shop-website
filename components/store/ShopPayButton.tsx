"use client";

import type { CSSProperties } from "react";

// "Buy it now" — the real purple "Buy with Shop Pay" button, not a
// lookalike. This directs a Shop Pay–enrolled buyer straight into an
// accelerated one-tap checkout for exactly this variant + quantity,
// skipping our own cart page entirely. Was blocked earlier: Shop Pay rides
// on Shopify Payments, which this store didn't have configured — now
// confirmed live (real Shop/PayPal/GPay/Venmo showing at Shopify's own
// checkout).
//
// Chose Shopify's own lightweight web component over two heavier
// alternatives: the full Buy Button SDK (a separate embeddable-widget
// system meant for dropping a whole product card into an arbitrary page,
// not surgically adding one button to an already-custom-built page), and
// the Shop Pay Wallet/PaymentRequest API (shopId+clientId config — for
// building a fully custom checkout UI, which isn't what we're doing; we
// still redirect to Shopify's own hosted checkout for the regular flow).
// This is Shopify's own documented "add this to any site" answer:
// https://shopify.dev/docs/api/storefront-web-components — loader script
// lives in app/store/layout.tsx so it's loaded once for every /store/*
// page (both the product page and the grid's Quick View modal render
// this via the shared AddToCartForm).
//
// The `variants` attribute confirmed (via Shopify's docs, not assumed)
// to want bare numeric variant ids — "123456789" — NOT the GraphQL GID
// our Product/ProductVariant types use everywhere else in this app, hence
// the split/pop below. Format is "id:quantity".
function numericVariantId(gid: string): string {
  return gid.split("/").pop() ?? gid;
}

export function ShopPayButton({
  variantId,
  quantity = 1,
}: {
  variantId: string;
  quantity?: number;
}) {
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  // No domain configured (e.g. a preview branch that hasn't set the env
  // var) — degrade to just not showing the button rather than rendering
  // one that's silently broken.
  if (!storeDomain) return null;

  return (
    <shop-pay-button
      // Force a clean remount rather than relying on this third-party
      // element to react to attribute changes on its own — a size/qty
      // change should always produce a fresh, correctly-targeted button.
      key={`${variantId}-${quantity}`}
      store-url={`https://${storeDomain}`}
      variants={`${numericVariantId(variantId)}:${quantity}`}
      // Shop Pay's own width custom property, applied !important
      // internally — matches the full-width "Add to cart" button above
      // it. See design-guidelines: width/height/border-radius are the
      // only things this component lets you customize; color is
      // deliberately fixed to Shop's own purple.
      style={{ "--shop-pay-button-width": "100%" } as CSSProperties}
    />
  );
}
