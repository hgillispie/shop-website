import "server-only";

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
  options: { method?: string; body?: unknown; next?: NextFetchRequestConfig } = {},
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
    // Only listProducts passes `next` — shipping/order calls must stay live.
    next: options.next,
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

type NextFetchRequestConfig = { revalidate?: number | false; tags?: string[] };

export type PrintifyVariant = {
  id: number;
  title: string;
  price: number; // cents
  is_enabled: boolean;
  is_default: boolean;
  sku: string;
};

export type PrintifyImage = {
  src: string;
  variant_ids: number[];
  is_default: boolean;
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string;
  images: PrintifyImage[];
  variants: PrintifyVariant[];
  // A Printify product is created against one print provider + blueprint —
  // this is what lets us partition a cart by provider for shipping.
  print_provider_id: number;
  visible: boolean;
};

type PrintifyListResponse<T> = { data: T[] };

/**
 * List the products already created in the shop's Printify "API" store, so
 * they can be rendered on the site. Printify doesn't host a storefront for
 * custom integrations — display is entirely on this app.
 *
 * Cached for an hour (the catalog changes rarely) via Next's native fetch
 * cache, tagged so it can be force-revalidated with revalidateTag later if
 * ever needed. Only returns products marked visible in the Printify dashboard.
 */
export async function listProducts(
  shopId = process.env.PRINTIFY_SHOP_ID,
): Promise<PrintifyProduct[]> {
  const res = await printifyRequest<PrintifyListResponse<PrintifyProduct>>(
    `/shops/${shopId}/products.json`,
    { next: { revalidate: 3600, tags: ["printify-products"] } },
  );
  return res.data.filter((product) => product.visible);
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
