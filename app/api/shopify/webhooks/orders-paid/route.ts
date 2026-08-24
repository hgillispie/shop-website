import { after, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { serviceInvoices } from "@/lib/db/schema";
import { verifyShopifyWebhook } from "@/lib/shopify/admin";
import { sendInvoicePaidEmail } from "@/lib/email";

// orders/paid fires for BOTH a paid merch order (Task 1 — Shopify + Printify's
// app already handle that entirely on their own, nothing for us to do) and a
// paid repair-invoice Draft Order (Task 2 — the only case this route acts
// on). Distinguished by the "repair-invoice" + "invoice:{id}" tags set at
// draftOrderCreate time (see invoices/shopify-actions.ts) — Shopify carries
// draft order tags over to the resulting Order on payment.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    console.warn("[shopify webhook] invalid signature on orders/paid delivery");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { id: number | string; tags?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Webhook payloads carry tags as a comma-space-separated string, not an
  // array (that's only true of the GraphQL API shape) — confirmed current
  // Shopify behavior, easy to get wrong.
  const tags = (payload.tags ?? "").split(", ").filter(Boolean);
  if (!tags.includes("repair-invoice")) {
    return NextResponse.json({ ok: true, skipped: "not a repair invoice" });
  }

  const invoiceId = tags.find((t) => t.startsWith("invoice:"))?.split(":")[1];
  if (!invoiceId) {
    console.error(
      "[shopify webhook] order tagged repair-invoice but no invoice:{id} tag found, order:",
      payload.id,
    );
    return NextResponse.json({ ok: true, skipped: "no invoice id tag" });
  }

  // Atomic conditional update, not read-then-write — Shopify delivers
  // webhooks at-least-once, so a duplicate delivery must be a safe no-op
  // even if it lands concurrently with the first one. Doubles as the
  // existence check: zero rows back means either no such invoice or it
  // was already marked paid by an earlier delivery.
  const [updated] = await db
    .update(serviceInvoices)
    .set({
      paymentStatus: "paid",
      shopifyOrderId: String(payload.id),
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(serviceInvoices.id, invoiceId), ne(serviceInvoices.paymentStatus, "paid")))
    .returning();

  if (!updated) {
    return NextResponse.json({ ok: true, skipped: "no matching unpaid invoice" });
  }

  // Respond to Shopify immediately; the email send happens after — matches
  // this app's established webhook-handler posture (see the removed
  // Stripe/Printify webhook routes' history) rather than making Shopify
  // wait on Resend.
  after(() => {
    sendInvoicePaidEmail(updated).catch((error) => {
      console.error("[shopify webhook] failed to send invoice-paid email:", error);
    });
  });

  return NextResponse.json({ ok: true });
}
