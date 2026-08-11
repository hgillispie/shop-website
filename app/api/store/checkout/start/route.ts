import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { startCheckoutSchema } from "@/lib/validations/store";
import { CartPricingError, priceCart } from "@/lib/store/pricing";
import { db } from "@/lib/db/client";
import { storeOrderItems, storeOrders, type StoreOrderRow } from "@/lib/db/schema";
import { createPaymentIntentForOrder } from "@/lib/stripe";
import { checkIpAgainstRules, getClientIp } from "@/lib/ip-rules";

// Creates the order draft the moment someone reaches checkout — before
// email or shipping address are known. Priced on subtotal only (shipping
// depends on an address we don't have yet), and a PaymentIntent is created
// immediately on that provisional amount purely so the Address/Payment
// Elements can mount right away: that's what lets Link recognize a
// returning customer by email before they've typed anything else. See
// POST /api/store/checkout/update-details for where the real total lands,
// once shipping is known.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = startCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }
  const { lineItems } = parsed.data;

  let priced;
  try {
    priced = await priceCart(lineItems, { includeShipping: false });
  } catch (error) {
    if (error instanceof CartPricingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/store/checkout/start] pricing failed:", error);
    return NextResponse.json(
      { error: "Could not price your cart right now. Please try again shortly." },
      { status: 502 },
    );
  }

  const clientIp = getClientIp(request);
  const ipCheck = await checkIpAgainstRules(clientIp);

  let created: StoreOrderRow;
  try {
    [created] = await db
      .insert(storeOrders)
      .values({
        source: "online",
        status: "pending_payment",
        subtotalCents: priced.subtotalCents,
        shippingCents: 0,
        taxCents: 0,
        // Provisional — shipping isn't known yet. update-details moves this
        // to the real total once an address is collected.
        totalCents: priced.subtotalCents,
        ipAddress: clientIp,
        flaggedReason: ipCheck.matched
          ? `IP matched ${ipCheck.action} rule${ipCheck.note ? `: ${ipCheck.note}` : ""}`
          : null,
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
  } catch (error) {
    console.error("[api/store/checkout/start] failed to save order:", error);
    return NextResponse.json(
      { error: "Could not start checkout right now. Please try again shortly." },
      { status: 502 },
    );
  }

  try {
    const paymentIntent = await createPaymentIntentForOrder(created, { cardPresent: false });

    await db
      .update(storeOrders)
      .set({ stripePaymentIntentId: paymentIntent.id, updatedAt: new Date() })
      .where(eq(storeOrders.id, created.id));

    return NextResponse.json({
      orderRef: created.id,
      clientSecret: paymentIntent.client_secret,
      subtotalCents: priced.subtotalCents,
    });
  } catch (error) {
    console.error("[api/store/checkout/start] failed to create PaymentIntent:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
