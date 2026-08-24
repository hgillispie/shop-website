import { Resend } from "resend";
import { siteConfig } from "@/data/site-config";
import type { AppointmentRequestRow, JobRow, ServiceInvoiceRow } from "@/lib/db/schema";

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const OWNER_EMAIL = process.env.OWNER_EMAIL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

let cached: Resend | null = null;

// Lazy so importing this module (e.g. during build-time page-data collection)
// never throws — the Resend constructor requires a key immediately.
function getResendConfigured() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set — skipping email send.");
    return null;
  }
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export async function sendOwnerNewRequestEmail(request: AppointmentRequestRow) {
  const resend = getResendConfigured();
  if (!resend || !OWNER_EMAIL) {
    console.warn("[email] OWNER_EMAIL or RESEND_API_KEY missing — logging instead.");
    console.info("[email] new request:", request.id, request.name);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `New appointment request — ${request.name} (${request.bikeYearMakeModel})`,
    text: [
      `${request.name} submitted a new appointment request.`,
      "",
      `Phone: ${request.phone}`,
      `Email: ${request.email}`,
      `Bike: ${request.bikeYearMakeModel}`,
      request.serviceTypes.length > 0
        ? `Services: ${request.serviceTypes.join(", ")}`
        : null,
      request.preferredDropoffAt
        ? `Preferred drop-off: ${request.preferredDropoffAt.toLocaleDateString()}`
        : null,
      "",
      "Details:",
      request.details,
      "",
      `Review & respond: ${SITE_URL}/admin/requests/${request.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendCustomerApprovalEmail(
  request: AppointmentRequestRow,
  job: JobRow,
) {
  const resend = getResendConfigured();
  if (!resend) return;

  const dropoff = job.dropoffAt
    ? job.dropoffAt.toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "a time we'll confirm shortly";

  await resend.emails.send({
    from: FROM,
    to: request.email,
    subject: `Appointment confirmed — ${siteConfig.shopName}`,
    text: [
      `Hi ${request.name},`,
      "",
      `Your appointment is confirmed for ${dropoff}.`,
      "",
      `Drop off at: ${siteConfig.address}`,
      `Questions? Call or text ${siteConfig.phone}.`,
      "",
      `— ${siteConfig.shopName}`,
    ].join("\n"),
  });
}

export async function sendCustomerResponseEmail(
  request: AppointmentRequestRow,
  message: string,
) {
  const resend = getResendConfigured();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: request.email,
    subject: `Re: your appointment request — ${siteConfig.shopName}`,
    text: [`Hi ${request.name},`, "", message, "", `— ${siteConfig.shopName}`].join("\n"),
  });
}

// Store-order emails (sendOrderConfirmationEmail, sendOrderShippedEmail,
// sendOwnerFulfillmentFailedEmail) were removed here as part of the Shopify
// migration (see docs/shopify-migration-plan.md) — Shopify sends its own
// merch-order confirmation/shipping emails now, and there's no local
// storeOrders row to alert on a failed fulfillment for.

// Repair-invoice payment confirmation — Task 2's own branded email, kept on
// Resend deliberately (unlike merch orders) since this is tied to the
// CRM/branding the owner already uses for repair work. Fired from
// app/api/shopify/webhooks/orders-paid/route.ts once Shopify reports the
// Draft Order's resulting order as paid.
export async function sendInvoicePaidEmail(invoice: ServiceInvoiceRow) {
  const resend = getResendConfigured();
  if (!resend || !invoice.customerEmail) {
    console.info(
      "[email] skipping invoice-paid email (no RESEND_API_KEY or no customer email):",
      invoice.id,
    );
    return;
  }

  const total = (invoice.totalDueCents / 100).toFixed(2);

  await resend.emails.send({
    from: FROM,
    to: invoice.customerEmail,
    subject: `Payment received — Invoice #${invoice.invoiceNumber} — ${siteConfig.shopName}`,
    text: [
      `Hi ${invoice.customerName},`,
      "",
      `We've received your payment for invoice #${invoice.invoiceNumber} — thank you.`,
      "",
      `Total paid: $${total}`,
      "",
      `Questions? Call or text ${siteConfig.phone}.`,
      "",
      `— ${siteConfig.shopName}`,
    ].join("\n"),
  });
}
