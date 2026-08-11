import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { toShippingAddress, updateCheckoutDetailsSchema } from "@/lib/validations/store";
import { CartPricingError, priceCart } from "@/lib/store/pricing";
import { db } from "@/lib/db/client";
import { storeOrders } from "@/lib/db/schema";
import { getStoreOrderById } from "@/lib/db/queries";
import { updatePaymentIntentAmountForOrder } from "@/lib/stripe";

// Fires once the customer has entered an email (LinkAuthenticationElement)
// and a complete shipping address (AddressElement) on the checkout page.
// Re-derives shipping from the order's own already-snapshotted items —
// never re-trusts line items resent by the client at this stage either —
// and moves the same PaymentIntent from its provisional (subtotal-only)
// amount to the real total, rather than creating a second PaymentIntent.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = updateCheckoutDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const order = await getStoreOrderById(input.orderRef);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "This order has already been processed." }, { status: 409 });
  }

  let priced;
  try {
    priced = await priceCart(
      order.items.map((item) => ({
        printifyProductId: item.printifyProductId,
        printifyVariantId: item.printifyVariantId,
        quantity: item.quantity,
      })),
      { includeShipping: true },
    );
  } catch (error) {
    if (error instanceof CartPricingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/store/checkout/update-details] pricing failed:", error);
    return NextResponse.json(
      { error: "Could not price shipping right now. Please try again shortly." },
      { status: 502 },
    );
  }

  const [updated] = await db
    .update(storeOrders)
    .set({
      email: input.email,
      shippingAddress: toShippingAddress(input),
      subtotalCents: priced.subtotalCents,
      shippingCents: priced.shippingCents,
      totalCents: priced.totalCents,
      shippingBreakdown: priced.shippingBreakdown,
      updatedAt: new Date(),
    })
    .where(eq(storeOrders.id, order.id))
    .returning();

  try {
    await updatePaymentIntentAmountForOrder(updated);
  } catch (error) {
    console.error("[api/store/checkout/update-details] failed to update PaymentIntent:", error);
    return NextResponse.json(
      { error: "Could not update your total. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    subtotalCents: priced.subtotalCents,
    shippingCents: priced.shippingCents,
    taxCents: priced.taxCents,
    totalCents: priced.totalCents,
    shippingBreakdown: priced.shippingBreakdown,
  });
}
