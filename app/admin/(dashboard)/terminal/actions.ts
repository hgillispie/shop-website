"use server";

import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { storeOrderItems, storeOrders, type StoreOrderRow } from "@/lib/db/schema";
import { getStoreOrderById } from "@/lib/db/queries";
import { createPaymentIntentForOrder, getStripe } from "@/lib/stripe";
import { priceCart } from "@/lib/store/pricing";
import { inPersonLineItemSchema, type InPersonLineItem } from "@/lib/validations/store";

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
// (items are handed over on the spot, or nothing ships at all for a
// service charge). A "current sale" can mix real Printify merch with
// manually-entered service charges (an oil change plus a shirt, say):
// merch lines are re-priced against the live catalog exactly like before;
// manual lines have no catalog to check against, so the admin-typed amount
// is trusted directly — that's a different trust boundary than the public
// storefront, since this is reachable only by an authenticated admin, not
// an anonymous customer.
export async function createInPersonOrder(rawLineItems: InPersonLineItem[]) {
  await requireSession();

  // Plain Errors rather than letting a ZodError cross the Server Action
  // boundary — Next redacts server-error detail in production, so a
  // validation message needs to already be a plain Error to survive that.
  const parsed = inPersonLineItemSchema.array().min(1, "Add at least one item.").safeParse(rawLineItems);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid sale.");
  }
  const lineItems = parsed.data;

  const merchLines = lineItems.filter((line) => line.kind === "merch");
  const manualLines = lineItems.filter((line) => line.kind === "manual");

  const priced = await priceCart(
    merchLines.map(({ printifyProductId, printifyVariantId, quantity }) => ({
      printifyProductId,
      printifyVariantId,
      quantity,
    })),
    { includeShipping: false },
  );
  const manualSubtotalCents = manualLines.reduce((sum, line) => sum + line.priceCents, 0);
  const totalCents = priced.totalCents + manualSubtotalCents;

  const [created] = await db
    .insert(storeOrders)
    .values({
      source: "in_person",
      status: "pending_payment",
      subtotalCents: priced.subtotalCents + manualSubtotalCents,
      shippingCents: 0,
      taxCents: 0,
      totalCents,
    })
    .returning();

  const itemRows = [
    ...priced.items.map((item) => ({
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
    // Sentinel values (a non-Printify product id, zeroed variant/provider
    // ids) satisfy storeOrderItems' NOT NULL columns without a schema
    // change. Safe to skip Printify entirely: the webhook only ever calls
    // it for source: "online" orders, and this is always "in_person".
    ...manualLines.map((line) => ({
      orderId: created.id,
      printifyProductId: "manual",
      printifyVariantId: 0,
      printProviderId: 0,
      title: line.memo,
      variantLabel: null,
      quantity: 1,
      unitPriceCents: line.priceCents,
      imageUrl: null,
    })),
  ];
  if (itemRows.length > 0) {
    await db.insert(storeOrderItems).values(itemRows);
  }

  return { orderRef: created.id, totalCents };
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
