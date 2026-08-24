"use server";

import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { serviceInvoices } from "@/lib/db/schema";
import { getServiceInvoiceById } from "@/lib/db/queries";
import { createDraftOrder, sendDraftOrderInvoice } from "@/lib/shopify/admin";

// Same posture as invoices/actions.ts — a Server Action is its own POST
// endpoint, checked explicitly regardless of the page-level gate.
async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
  return session;
}

// Parts and labor become Shopify custom line items (none of this maps to
// real Shopify inventory — see lib/shopify/admin.ts for why). Tax/CC-fee
// are their own explicit line items rather than letting Shopify calculate
// tax, since the invoice already computed both from the owner's own rates
// (lib/invoices/totals.ts) — the draft order itself is taxExempt so
// Shopify never adds tax on top of what's already itemized here.
function buildLineItems(invoice: NonNullable<Awaited<ReturnType<typeof getServiceInvoiceById>>>) {
  const lineItems: { title: string; quantity: number; price: string }[] = [];

  for (const job of invoice.jobs) {
    for (const part of job.parts) {
      if (part.qty === 0) continue;
      lineItems.push({
        title: (part.description || "Part").slice(0, 255),
        quantity: part.qty,
        price: (part.unitPriceCents / 100).toFixed(2),
      });
    }
    if (job.laborCents > 0) {
      lineItems.push({
        title: `Labor — ${job.customerDescription || "repair"}`.slice(0, 255),
        quantity: 1,
        price: (job.laborCents / 100).toFixed(2),
      });
    }
  }

  if (invoice.taxCents > 0) {
    lineItems.push({
      title: "Sales tax",
      quantity: 1,
      price: (invoice.taxCents / 100).toFixed(2),
    });
  }
  if (invoice.ccFeeCents > 0) {
    lineItems.push({
      title: "Card processing fee",
      quantity: 1,
      price: (invoice.ccFeeCents / 100).toFixed(2),
    });
  }

  return lineItems;
}

export async function sendInvoiceToShopify(invoiceId: string) {
  await requireSession();

  const invoice = await getServiceInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice not found.");
  if (!invoice.customerEmail) {
    throw new Error(
      "Add a customer email to this invoice before sending a Shopify invoice.",
    );
  }

  const lineItems = buildLineItems(invoice);
  if (lineItems.length === 0) {
    throw new Error("Add at least one job with parts or labor before sending an invoice.");
  }

  const [firstName, ...rest] = invoice.customerName.trim().split(/\s+/);
  const vehicle = [invoice.vehicleYear, invoice.vehicleMake, invoice.vehicleModel]
    .filter(Boolean)
    .join(" ");

  const draftOrder = await createDraftOrder({
    email: invoice.customerEmail,
    note: [`R.O. #${invoice.invoiceNumber}`, vehicle].filter(Boolean).join(" — "),
    // repair-invoice + invoice:{id} is how the orders/paid webhook tells a
    // paid repair invoice apart from a paid merch order on the same topic —
    // see app/api/shopify/webhooks/orders-paid/route.ts. Draft order tags
    // carry over to the resulting Order on payment (confirmed behavior).
    tags: ["repair-invoice", `invoice:${invoice.id}`],
    billingAddress: invoice.customerAddress
      ? {
          address1: invoice.customerAddress,
          firstName: firstName || invoice.customerName,
          lastName: rest.join(" ") || invoice.customerName,
          phone: invoice.customerPhone ?? undefined,
        }
      : undefined,
    lineItems,
  });

  const sent = await sendDraftOrderInvoice(draftOrder.id);
  const invoiceUrl = sent.invoiceUrl ?? draftOrder.invoiceUrl ?? null;

  await db
    .update(serviceInvoices)
    .set({
      paymentStatus: "invoice_sent",
      shopifyDraftOrderId: draftOrder.id,
      shopifyInvoiceUrl: invoiceUrl,
      updatedAt: new Date(),
    })
    .where(eq(serviceInvoices.id, invoiceId));

  return { invoiceUrl };
}
