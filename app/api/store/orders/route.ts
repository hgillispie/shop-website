import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrderSchema } from "@/lib/validations/store";
import { CartPricingError, priceCart } from "@/lib/store/pricing";
import { db } from "@/lib/db/client";
import { storeOrderItems, storeOrders, type StoreOrderRow } from "@/lib/db/schema";
import { checkIpAgainstRules, getClientIp } from "@/lib/ip-rules";

// Creates the order draft before payment — this is the DB row that
// getStoreOrderById (the real getOrderByRef) looks up later, and the one
// place prices/availability get re-verified server-side. Never trusts a
// client-submitted price.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  const { lineItems, shippingAddress, email } = parsed.data;

  let priced;
  try {
    priced = await priceCart(lineItems, { includeShipping: true });
  } catch (error) {
    if (error instanceof CartPricingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/store/orders] pricing failed:", error);
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
        email,
        shippingAddress,
        subtotalCents: priced.subtotalCents,
        shippingCents: priced.shippingCents,
        taxCents: priced.taxCents,
        totalCents: priced.totalCents,
        shippingBreakdown: priced.shippingBreakdown,
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
    console.error("[api/store/orders] failed to save order:", error);
    return NextResponse.json(
      { error: "Could not create your order right now. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    orderRef: created.id,
    subtotalCents: priced.subtotalCents,
    shippingCents: priced.shippingCents,
    taxCents: priced.taxCents,
    totalCents: priced.totalCents,
    shippingBreakdown: priced.shippingBreakdown,
  });
}
