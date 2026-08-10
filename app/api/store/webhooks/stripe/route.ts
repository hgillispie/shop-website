import { NextResponse } from "next/server";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db/client";
import { storeOrders } from "@/lib/db/schema";
import { getStoreOrderById } from "@/lib/db/queries";
import { createOrder as createPrintifyOrder, type PrintifyAddressTo } from "@/lib/printify";
import {
  sendInPersonReceiptEmail,
  sendOrderConfirmationEmail,
  sendOwnerFulfillmentFailedEmail,
} from "@/lib/email";
import type { ShippingAddress } from "@/lib/validations/store";

// Both online and in-person payments land here — one webhook, one code
// path, branching once on order.source rather than two divergent handlers.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 401 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhooks/stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ ok: true });
  }

  // Cast rather than rely on automatic narrowing on event.type — this
  // package's dual ESM/CJS type declarations don't consistently resolve
  // Event as the discriminated union its .d.ts sources declare it to be.
  const intent = event.data.object as Stripe.PaymentIntent;
  const orderRef = intent.metadata?.orderRef;
  if (!orderRef) {
    console.error("[webhooks/stripe] payment_intent.succeeded with no orderRef metadata:", intent.id);
    return NextResponse.json({ ok: true });
  }

  // Atomic conditional status flip — the idempotency guard. Stripe delivers
  // webhooks at-least-once, so duplicates happen. This runs synchronously,
  // before responding, so two near-simultaneous duplicate deliveries can't
  // both pass it and double-fulfill the same order.
  const [updated] = await db
    .update(storeOrders)
    .set({ status: "paid", stripePaymentIntentId: intent.id, updatedAt: new Date() })
    .where(and(eq(storeOrders.id, orderRef), eq(storeOrders.status, "pending_payment")))
    .returning();

  if (!updated) {
    // Already handled by a prior delivery, or the order wasn't in a state
    // this should act on. Ack and stop — re-running fulfillment would be wrong.
    return NextResponse.json({ ok: true });
  }

  // Respond fast; do the slower work (Printify + email) after acknowledging.
  after(async () => {
    const order = await getStoreOrderById(updated.id);
    if (!order) return;

    if (order.source === "online") {
      try {
        const printifyOrder = await createPrintifyOrder({
          lineItems: order.items.map((item) => ({
            product_id: item.printifyProductId,
            variant_id: item.printifyVariantId,
            quantity: item.quantity,
          })),
          shippingAddress: toPrintifyAddress(order.shippingAddress, order.email),
          externalId: intent.id,
        });

        await db
          .update(storeOrders)
          .set({ printifyOrderId: printifyOrder.id, updatedAt: new Date() })
          .where(eq(storeOrders.id, order.id));

        await sendOrderConfirmationEmail(order);
      } catch (error) {
        // Payment already succeeded — retrying the webhook wouldn't help,
        // so this stays a paid order marked for manual attention rather
        // than a webhook failure.
        const message = error instanceof Error ? error.message : String(error);
        console.error("[webhooks/stripe] Printify order creation failed:", order.id, message);
        await db
          .update(storeOrders)
          .set({ status: "fulfillment_failed", printifyError: message, updatedAt: new Date() })
          .where(eq(storeOrders.id, order.id));
        await sendOwnerFulfillmentFailedEmail(order, message);
      }
    } else {
      // In-person: item is already handed to the customer at the counter —
      // no shipping, no Printify order, just a receipt.
      await sendInPersonReceiptEmail(order);
    }
  });

  return NextResponse.json({ ok: true });
}

function toPrintifyAddress(
  shippingAddress: unknown,
  email: string | null,
): PrintifyAddressTo {
  const addr = shippingAddress as ShippingAddress;
  return {
    first_name: addr.firstName,
    last_name: addr.lastName,
    email: email ?? undefined,
    phone: addr.phone,
    country: addr.country,
    region: addr.region,
    address1: addr.address1,
    address2: addr.address2,
    city: addr.city,
    zip: addr.zip,
  };
}
