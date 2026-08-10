"use server";

import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { storeOrderItems, storeOrders, type StoreOrderRow } from "@/lib/db/schema";
import { getStoreOrderById } from "@/lib/db/queries";
import { createPaymentIntentForOrder, getStripe } from "@/lib/stripe";
import { priceCart } from "@/lib/store/pricing";
import type { CartLineItem } from "@/lib/validations/store";

// A Server Action is a POST endpoint in its own right, reachable
// independent of which page renders its caller — the page-level session
// gate (middleware.ts) is not on its own enough for something that moves
// real money. Each action here checks explicitly too.
async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
  return session;
}

export async function createConnectionToken() {
  await requireSession();
  const token = await getStripe().terminal.connectionTokens.create();
  return { secret: token.secret };
}

// Creates the order draft for an in-person sale — no shipping to price
// (items are handed over on the spot), but still re-prices against the
// live Printify catalog rather than trusting anything client-side.
export async function createInPersonOrder(lineItems: CartLineItem[]) {
  await requireSession();

  const priced = await priceCart(lineItems, { includeShipping: false });

  const [created] = await db
    .insert(storeOrders)
    .values({
      source: "in_person",
      status: "pending_payment",
      subtotalCents: priced.subtotalCents,
      shippingCents: 0,
      taxCents: 0,
      totalCents: priced.totalCents,
    })
    .returning();

  if (priced.items.length > 0) {
    await db.insert(storeOrderItems).values(
      priced.items.map((item) => ({
        orderId: created.id,
        printifyProductId: item.printifyProductId,
        printifyVariantId: item.printifyVariantId,
        printProviderId: item.printProviderId,
        title: item.title,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        imageUrl: item.imageUrl,
      })),
    );
  }

  return { orderRef: created.id, totalCents: priced.totalCents };
}

export async function createTerminalPaymentIntent(orderRef: string) {
  await requireSession();

  const order = await getStoreOrderById(orderRef);
  if (!order) throw new Error("Order not found.");
  if (order.status !== "pending_payment") {
    throw new Error("This order has already been processed.");
  }

  const paymentIntent = await createPaymentIntentForOrder(order as StoreOrderRow, {
    cardPresent: true,
  });

  await db
    .update(storeOrders)
    .set({ stripePaymentIntentId: paymentIntent.id, updatedAt: new Date() })
    .where(eq(storeOrders.id, order.id));

  return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
}
