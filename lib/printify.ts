import "server-only";
import { unstable_cache } from "next/cache";

// Server-only Printify REST client. Printify's API has no CORS support —
// calls from browser JS are rejected — so nothing here may ever be imported
// by a client component.
//
// One-time setup in the Printify account:
//   1. My Stores -> Add new store -> choose "API" as the store type.
//   2. My Profile -> Connections -> generate a personal access token.
//   3. GET /v1/shops.json (or the Printify dashboard) for that store's shop id.
//
// Printify has no sandbox/test mode — this always talks to the one real
// connected shop. Test by creating real orders (they land "on hold") and
// canceling them manually; never call sendToProduction on test data.

const BASE_URL = "https://api.printify.com/v1";

async function printifyRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is not set");

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "swafford-speed-store",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    // Always live at the fetch level — listProducts is the only call that's
    // ever cached, and it does so via unstable_cache around the whole
    // function (see below), not via fetch's own caching.
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      data && data.errors ? JSON.stringify(data.errors) : res.statusText;
    throw new Error(`Printify API ${options.method ?? "GET"} ${path} failed (${res.status}): ${message}`);
  }
  return data as T;
}

export type PrintifyVariant = {
  id: number;
  title: string;
  price: number; // cents
  is_enabled: boolean;
  is_default: boolean;
  sku: string;
  // One value-id per product-level option — e.g. [colorValueId, sizeValueId].
  // NOT reliably positional against PrintifyProduct.options: confirmed
  // against this shop's real catalog that the SAME product can have some
  // variants ordered [color, size] and others [size, color] (e.g. the
  // hoodie blueprint). Never read this by index — use variantValueFor()
  // below, which resolves a variant's value for a given option by set
  // membership instead of position.
  options: number[];
};

export type PrintifyImage = {
  src: string;
  variant_ids: number[];
  is_default: boolean;
};

export type PrintifyOptionValue = {
  id: number;
  title: string;
  // Only present on color-type options — hex strings, e.g. ["#642838"].
  colors?: string[];
};

export type PrintifyOption = {
  name: string;
  // Printify's real catalog uses "color" and "size" for apparel, but other
  // blueprints (mugs, stickers) can have different/fewer option types —
  // never assume exactly these two exist or that they're in this order.
  type: string;
  values: PrintifyOptionValue[];
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string;
  images: PrintifyImage[];
  variants: PrintifyVariant[];
  options: PrintifyOption[];
  // A Printify product is created against one print provider + blueprint —
  // this is what lets us partition a cart by provider for shipping.
  print_provider_id: number;
  visible: boolean;
};

// variantValueFor() lives in lib/store/variants.ts, not here — this file
// starts with `import "server-only"`, and client components (the color/size
// pickers, the photo gallery) need to call it. Importing any real value
// (not just a `type`) from here would pull that server-only sentinel into
// the client bundle and hard-fail the build.

type PrintifyListResponse<T> = { data: T[] };

async function fetchProducts(shopId: string | undefined): Promise<PrintifyProduct[]> {
  const res = await printifyRequest<PrintifyListResponse<PrintifyProduct>>(
    `/shops/${shopId}/products.json`,
  );
  return res.data.filter((product) => product.visible);
}

/**
 * List the products already created in the shop's Printify "API" store, so
 * they can be rendered on the site. Printify doesn't host a storefront for
 * custom integrations — display is entirely on this app.
 *
 * Cached briefly via unstable_cache, which caches the resolved value
 * directly rather than hooking into fetch's own `next.revalidate` extension
 * — that extension produced an intermittent hydration mismatch on the
 * product detail page (the cached description string diverged between the
 * SSR pass and the RSC payload used for hydration on this specific dynamic
 * route); caching the plain return value instead sidesteps that whole class
 * of issue. Only returns products marked visible in the Printify dashboard.
 *
 * Originally a 1-hour window on the assumption the catalog changes rarely —
 * revised down to 60s after a real product (added in Printify) took up to
 * an hour to appear on /store, which reads as "the store is broken" while
 * the catalog is actively being curated. 60s keeps most of the caching
 * benefit (no live Printify call on every request) while changes show up
 * within a minute instead of up to an hour.
 */
export async function listProducts(
  shopId = process.env.PRINTIFY_SHOP_ID,
): Promise<PrintifyProduct[]> {
  const cached = unstable_cache(fetchProducts, ["printify-products"], {
    revalidate: 60,
    tags: ["printify-products"],
  });
  return cached(shopId);
}

export async function getProductById(
  id: string,
  shopId = process.env.PRINTIFY_SHOP_ID,
): Promise<PrintifyProduct | null> {
  const products = await listProducts(shopId);
  return products.find((p) => p.id === id) ?? null;
}

export type PrintifyShippingLineItem = {
  product_id: string;
  variant_id: number;
  quantity: number;
};

/**
 * Real shipping cost for an actual set of line items — always called live,
 * never cached, and always for line items from a SINGLE print provider (the
 * caller partitions the cart first — see lib/store/pricing.ts). This is what
 * makes the "Printify charges shipping per provider" behavior honest instead
 * of an estimate.
 *
 * NOTE: the exact response shape should be confirmed against a live call
 * during testing — Printify's docs didn't render a static example at
 * plan time. `.standard` matches shipping_method: 1 used in createOrder.
 */
export async function getShippingCost(
  lineItems: PrintifyShippingLineItem[],
  shopId = process.env.PRINTIFY_SHOP_ID,
): Promise<{ standard: number }> {
  return printifyRequest(`/shops/${shopId}/orders/shipping.json`, {
    method: "POST",
    body: { line_items: lineItems },
  });
}

export type PrintifyAddressTo = {
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
};

export type PrintifyOrderLineItem = {
  product_id: string;
  variant_id: number;
  quantity: number;
};

/**
 * Create an order after a customer has paid. `externalId` should be the
 * Stripe PaymentIntent id, so Printify's side can be matched back to ours.
 */
export async function createOrder({
  lineItems,
  shippingAddress,
  externalId,
  shopId = process.env.PRINTIFY_SHOP_ID,
}: {
  lineItems: PrintifyOrderLineItem[];
  shippingAddress: PrintifyAddressTo;
  externalId: string;
  shopId?: string;
}) {
  return printifyRequest<{ id: string }>(`/shops/${shopId}/orders.json`, {
    method: "POST",
    body: {
      external_id: externalId,
      line_items: lineItems,
      shipping_method: 1, // standard shipping
      send_shipping_notification: false, // this app sends its own emails
      address_to: shippingAddress,
    },
  });
}

/** Only ever call this on real orders — never on test orders. */
export async function sendToProduction(
  orderId: string,
  shopId = process.env.PRINTIFY_SHOP_ID,
) {
  return printifyRequest(`/shops/${shopId}/orders/${orderId}/send_to_production.json`, {
    method: "POST",
  });
}

/** Printify only accepts this while an order is still "on-hold" or
 * "payment-not-received" — once it's in production, it's too late. This is
 * how test orders get cleaned up. */
export async function cancelOrder(
  orderId: string,
  shopId = process.env.PRINTIFY_SHOP_ID,
) {
  return printifyRequest(`/shops/${shopId}/orders/${orderId}/cancel.json`, {
    method: "POST",
  });
}

/**
 * Tells Printify a product's publish attempt didn't complete on this
 * sales channel — see the `product:publish:started` handling in
 * app/api/store/webhooks/printify/route.ts for why this app always
 * reports failure rather than success. Printify's dashboard locks a
 * product (`is_locked: true`, edit/delete controls disabled) the moment
 * publishing starts and keeps it locked until either publishing_succeeded
 * or publishing_failed is called — this app has no code path that ever
 * actually publishes a product to an external channel (products are
 * rendered straight from listProducts(), never synced elsewhere), so
 * nothing was ever going to call this on its own until this fix.
 */
export async function reportPublishingFailed(
  productId: string,
  reason: string,
  shopId = process.env.PRINTIFY_SHOP_ID,
) {
  return printifyRequest(`/shops/${shopId}/products/${productId}/publishing_failed.json`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * One-time setup call — see scripts/register-printify-webhook.mjs. Not
 * something the running app ever calls on its own.
 */
export async function createWebhook({
  topic,
  url,
  secret,
  shopId = process.env.PRINTIFY_SHOP_ID,
}: {
  topic: string;
  url: string;
  secret: string;
  shopId?: string;
}) {
  return printifyRequest(`/shops/${shopId}/webhooks.json`, {
    method: "POST",
    body: { topic, url, secret },
  });
}
