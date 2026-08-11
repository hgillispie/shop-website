import "server-only";
import { getShippingCost, listProducts } from "@/lib/printify";
import type { CartLineItem } from "@/lib/validations/store";

export type PricedLineItem = {
  printifyProductId: string;
  printifyVariantId: number;
  printProviderId: number;
  title: string;
  variantLabel: string | null;
  quantity: number;
  unitPriceCents: number;
  imageUrl: string | null;
};

export type ShippingBreakdownEntry = {
  printProviderId: number;
  cents: number;
  // True when Printify's live shipping-cost endpoint failed and this is a
  // flat placeholder instead of a real quote — see the comment below.
  estimated?: boolean;
};

// Printify's real-time shipping-cost endpoint (POST /orders/shipping.json)
// has been returning a bare 500 Internal Server Error for this shop's
// catalog, while product listing and order creation both work fine — this
// looks like an issue on Printify's side, not a request-shape problem here
// (confirmed by hand against their API directly). Falling back to a flat
// placeholder rather than hard-blocking checkout entirely, but flagging it
// clearly (`estimated: true`) rather than presenting it as a real quote —
// this needs a real fix (or at least a decision) before relying on it for
// real orders, since under/over-charging shipping is exactly what the
// per-provider quote was built to avoid.
const FALLBACK_SHIPPING_CENTS = 699;

export type PricedOrder = {
  items: PricedLineItem[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingBreakdown: ShippingBreakdownEntry[];
};

// Thrown for anything the customer can act on (item no longer available) —
// callers should show `.message` directly rather than a generic 500.
export class CartPricingError extends Error {}

/**
 * Re-prices a cart against live/cached Printify product data — never trusts
 * a client-submitted price — and re-validates each variant is still
 * enabled, not just priced. Shared by the online order route and the
 * in-person Terminal action.
 *
 * `includeShipping: false` skips the Printify shipping-cost lookup entirely
 * — used for in-person counter sales, where items are handed over on the
 * spot and nothing ships.
 */
export async function priceCart(
  lineItems: CartLineItem[],
  { includeShipping = true }: { includeShipping?: boolean } = {},
): Promise<PricedOrder> {
  const products = await listProducts();
  const productsById = new Map(products.map((p) => [p.id, p]));

  const items: PricedLineItem[] = lineItems.map((line) => {
    const product = productsById.get(line.printifyProductId);
    if (!product) {
      throw new CartPricingError("One of the items in your cart is no longer available.");
    }

    const variant = product.variants.find((v) => v.id === line.printifyVariantId);
    if (!variant) {
      throw new CartPricingError("One of the items in your cart is no longer available.");
    }
    if (!variant.is_enabled) {
      throw new CartPricingError(`"${product.title} — ${variant.title}" is no longer available.`);
    }

    const image =
      product.images.find((img) => img.variant_ids.includes(variant.id)) ??
      product.images.find((img) => img.is_default) ??
      product.images[0];

    return {
      printifyProductId: product.id,
      printifyVariantId: variant.id,
      printProviderId: product.print_provider_id,
      title: product.title,
      variantLabel: variant.title,
      quantity: line.quantity,
      unitPriceCents: variant.price,
      imageUrl: image?.src ?? null,
    };
  });

  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  let shippingBreakdown: ShippingBreakdownEntry[] = [];
  if (includeShipping) {
    // Printify charges shipping per print provider, not once per order —
    // partition the cart by provider and call getShippingCost once per
    // partition rather than guessing at a combined-request response shape.
    const byProvider = new Map<number, PricedLineItem[]>();
    for (const item of items) {
      const list = byProvider.get(item.printProviderId) ?? [];
      list.push(item);
      byProvider.set(item.printProviderId, list);
    }

    shippingBreakdown = await Promise.all(
      Array.from(byProvider.entries()).map(async ([printProviderId, providerItems]) => {
        try {
          const result = await getShippingCost(
            providerItems.map((item) => ({
              product_id: item.printifyProductId,
              variant_id: item.printifyVariantId,
              quantity: item.quantity,
            })),
          );
          return { printProviderId, cents: result.standard ?? 0 };
        } catch (error) {
          console.error(
            `[pricing] Printify shipping-cost lookup failed for provider ${printProviderId}, using flat estimate:`,
            error,
          );
          return { printProviderId, cents: FALLBACK_SHIPPING_CENTS, estimated: true };
        }
      }),
    );
  }

  const shippingCents = shippingBreakdown.reduce((sum, entry) => sum + entry.cents, 0);
  // Not collected yet — see the plan's tax note. Wired up as a real field so
  // turning it on later doesn't mean touching this pricing/total pipeline.
  const taxCents = 0;
  const totalCents = subtotalCents + shippingCents + taxCents;

  return { items, subtotalCents, shippingCents, taxCents, totalCents, shippingBreakdown };
}
