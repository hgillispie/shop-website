import { Resend } from "resend";
import { siteConfig } from "@/data/site-config";
import type {
  AppointmentRequestRow,
  JobRow,
  ServiceInvoiceJobRow,
  ServiceInvoicePartsLineRow,
  ServiceInvoiceRow,
} from "@/lib/db/schema";

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

type InvoiceWithJobs = ServiceInvoiceRow & {
  jobs: (ServiceInvoiceJobRow & { parts: ServiceInvoicePartsLineRow[] })[];
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// The owner's real complaint this answers: Shopify's own draft-order-invoice
// email (sent by draftOrderInvoiceSend) is generic and unbranded, and shows
// nothing like the actual invoice the owner's client already likes. Sent
// *alongside* Shopify's email, not instead of it — kept draftOrderInvoiceSend
// in the flow since skipping it left the checkout link's validity unverified
// (see shopify-actions.ts) — so the customer gets two emails for now. This
// is the one that actually looks and reads like the shop's invoice.
export async function sendInvoiceRepairEmail(invoice: InvoiceWithJobs, payUrl: string) {
  const resend = getResendConfigured();
  if (!resend || !invoice.customerEmail) {
    console.info(
      "[email] skipping branded repair-invoice email (no RESEND_API_KEY or no customer email):",
      invoice.id,
    );
    return;
  }

  const vehicle = [invoice.vehicleYear, invoice.vehicleMake, invoice.vehicleModel]
    .filter(Boolean)
    .join(" ");

  const jobLines = invoice.jobs.flatMap((job, i) => {
    const heading = `Job ${i + 1}: ${job.customerDescription || "Repair"}`;
    const partsLines = job.parts.map(
      (part) =>
        `    ${part.qty} x ${part.description || "Part"} — ${money(part.qty * part.unitPriceCents)}`,
    );
    const laborLine = job.laborCents > 0 ? `    Labor — ${money(job.laborCents)}` : null;
    return [heading, ...partsLines, laborLine, ""].filter((line): line is string => line !== null);
  });

  await resend.emails.send({
    from: FROM,
    to: invoice.customerEmail,
    subject: `Your invoice from ${siteConfig.shopName} — R.O. #${invoice.invoiceNumber}`,
    text: [
      `Hi ${invoice.customerName},`,
      "",
      `Here's the invoice for your${vehicle ? ` ${vehicle}` : " bike"}'s recent visit${
        invoice.serviceAdvisor ? `, written up by ${invoice.serviceAdvisor}` : ""
      }.`,
      "",
      ...jobLines,
      `Parts: ${money(invoice.partsTotalCents)}`,
      `Labor: ${money(invoice.laborTotalCents)}`,
      invoice.taxCents > 0 ? `Tax: ${money(invoice.taxCents)}` : null,
      invoice.ccFeeCents > 0 ? `Card processing fee: ${money(invoice.ccFeeCents)}` : null,
      `Total due: ${money(invoice.totalDueCents)}`,
      "",
      `Pay online: ${payUrl}`,
      "",
      `Questions? Call or text ${siteConfig.phone}.`,
      "",
      `— ${siteConfig.shopName}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  });
}

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
