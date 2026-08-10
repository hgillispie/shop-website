import { NextResponse } from "next/server";
import { after } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { storeOrders } from "@/lib/db/schema";
import {
  getStoreOrderByPrintifyOrderId,
  getStoreOrderByStripePaymentIntentId,
} from "@/lib/db/queries";
import { sendOrderShippedEmail } from "@/lib/email";

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("x-pfy-signature"); // "sha256=<hex>"
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (!signatureHeader || !secret) {
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 401 });
  }

  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const isValid =
    Buffer.byteLength(signatureHeader) === Buffer.byteLength(expected) &&
    crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  // Respond fast: Printify retries non-2xx responses up to 3 times, then
  // blocks the URL for an hour. Parse and act after acknowledging.
  let event: PrintifyWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  after(() => handlePrintifyEvent(event));

  return NextResponse.json({ ok: true });
}

// The exact field names can vary slightly by webhook version — this was
// written from Printify's documented shape, but worth confirming against a
// real delivery (their webhook settings page can send a test event) and
// adjusting if what actually arrives differs.
type PrintifyWebhookEvent = {
  type?: string;
  topic?: string;
  resource?: {
    id?: string;
    external_id?: string;
  };
  data?: Record<string, unknown>;
};

async function handlePrintifyEvent(event: PrintifyWebhookEvent) {
  const eventType = event.type ?? event.topic;
  const printifyOrderId = event.resource?.id;
  const externalId = event.resource?.external_id; // the Stripe PaymentIntent id we set on creation

  const order = externalId
    ? await getStoreOrderByStripePaymentIntentId(externalId)
    : printifyOrderId
      ? await getStoreOrderByPrintifyOrderId(printifyOrderId)
      : null;

  if (!order) {
    console.warn("[webhooks/printify] could not match event to a store order:", eventType, event);
    return;
  }

  switch (eventType) {
    case "order:sent-to-production":
      await db
        .update(storeOrders)
        .set({ status: "in_production", updatedAt: new Date() })
        .where(eq(storeOrders.id, order.id));
      break;

    case "order:shipment:created": {
      // Field names here are the part most likely to need adjusting once a
      // real payload is seen.
      const tracking = event.data as
        | { carrier?: string; number?: string }
        | undefined;
      await db
        .update(storeOrders)
        .set({
          status: "shipped",
          trackingCarrier: tracking?.carrier ?? order.trackingCarrier,
          trackingNumber: tracking?.number ?? order.trackingNumber,
          updatedAt: new Date(),
        })
        .where(eq(storeOrders.id, order.id));
      await sendOrderShippedEmail({
        ...order,
        trackingCarrier: tracking?.carrier ?? order.trackingCarrier,
        trackingNumber: tracking?.number ?? order.trackingNumber,
      });
      break;
    }

    default:
      console.log("[webhooks/printify] unhandled event:", eventType);
  }
}
