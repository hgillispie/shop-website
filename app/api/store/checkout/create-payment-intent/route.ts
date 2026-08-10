import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { getStoreOrderById } from "@/lib/db/queries";
import { storeOrders } from "@/lib/db/schema";
import { createPaymentIntentForOrder } from "@/lib/stripe";
import { eq } from "drizzle-orm";

// Deliberately takes only { orderRef } — the scaffold this was adapted from
// accepts { orderRef, amountInCents, currency, email } from the client, but
// the amount must never come from the client. It's re-derived here from the
// order row POST /api/store/orders already wrote.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const orderRef = typeof body === "object" && body !== null ? (body as Record<string, unknown>).orderRef : null;
  if (typeof orderRef !== "string" || !orderRef) {
    return NextResponse.json({ error: "Missing orderRef." }, { status: 400 });
  }

  const order = await getStoreOrderById(orderRef);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "This order has already been processed." }, { status: 409 });
  }

  try {
    const paymentIntent = await createPaymentIntentForOrder(order, { cardPresent: false });

    await db
      .update(storeOrders)
      .set({ stripePaymentIntentId: paymentIntent.id, updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[api/store/checkout/create-payment-intent] failed:", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
