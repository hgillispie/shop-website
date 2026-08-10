"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { storeOrders } from "@/lib/db/schema";
import { getStoreOrderById } from "@/lib/db/queries";
import { createOrder as createPrintifyOrder, type PrintifyAddressTo } from "@/lib/printify";
import { sendOrderConfirmationEmail, sendOwnerFulfillmentFailedEmail } from "@/lib/email";
import type { ShippingAddress } from "@/lib/validations/store";

// For fulfillment_failed rows — the Printify order creation that failed
// right after payment succeeded. Re-attempts the same call.
export async function retryPrintifyOrder(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;

  const order = await getStoreOrderById(orderId);
  if (!order || order.status !== "fulfillment_failed") return;
  if (!order.shippingAddress) return;

  const addr = order.shippingAddress as ShippingAddress;
  const shippingAddress: PrintifyAddressTo = {
    first_name: addr.firstName,
    last_name: addr.lastName,
    email: order.email ?? undefined,
    phone: addr.phone,
    country: addr.country,
    region: addr.region,
    address1: addr.address1,
    address2: addr.address2,
    city: addr.city,
    zip: addr.zip,
  };

  try {
    const printifyOrder = await createPrintifyOrder({
      lineItems: order.items.map((item) => ({
        product_id: item.printifyProductId,
        variant_id: item.printifyVariantId,
        quantity: item.quantity,
      })),
      shippingAddress,
      externalId: order.stripePaymentIntentId ?? order.id,
    });

    await db
      .update(storeOrders)
      .set({ status: "paid", printifyOrderId: printifyOrder.id, printifyError: null, updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));

    await sendOrderConfirmationEmail(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(storeOrders)
      .set({ printifyError: message, updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    await sendOwnerFulfillmentFailedEmail(order, message);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
}

// Manual fallback in case the Printify shipment webhook isn't set up yet or
// a specific event was missed.
export async function updateTracking(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const trackingCarrier = String(formData.get("trackingCarrier") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  if (!orderId) return;

  await db
    .update(storeOrders)
    .set({
      trackingCarrier: trackingCarrier || null,
      trackingNumber: trackingNumber || null,
      status: trackingNumber ? "shipped" : undefined,
      updatedAt: new Date(),
    })
    .where(eq(storeOrders.id, orderId));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
