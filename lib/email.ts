import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/data/site-config";
import type {
  AppointmentRequestRow,
  IntakeDraftRow,
  JobRow,
  ServiceInvoiceJobRow,
  ServiceInvoicePartsLineRow,
  ServiceInvoiceRow,
} from "@/lib/db/schema";
import {
  INVOICE_EMAIL_BRAND,
  customerDocumentEmailSubject,
  customerDocumentPdfFilename,
  customerDocumentStage,
  renderInvoiceEmailBody,
  renderInvoiceEmailText,
  renderPaidInvoiceEmailBody,
} from "@/lib/invoices/document-stage";

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

// The only one of the three appointment emails that's a real "confirmation"
// from the customer's point of view — given the new-brand HTML treatment
// (see renderBrandedEmailShell) alongside the existing plain-text version,
// which stays as the non-HTML-client fallback.
function renderAppointmentConfirmedHtml(name: string, dropoff: string): string {
  const e = escapeHtml;
  const bodyHtml = `
        <tr>
          <td style="padding:24px 32px 0;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.1em;color:${BRAND.orange};">
              APPOINTMENT CONFIRMED
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 0;font-size:14px;line-height:1.5;color:${BRAND.dark};">
            Hi ${e(name)},<br />
            Your appointment is confirmed. See you then.
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf1e7;border-left:4px solid ${BRAND.orangeDark};">
              <tr>
                <td style="padding:14px 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:bold;color:${BRAND.dark};">
                  ${e(dropoff)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 0;font-size:13px;line-height:1.5;color:#555555;">
            Drop off at: ${e(siteConfig.address)}
          </td>
        </tr>`;
  return renderBrandedEmailShell(bodyHtml);
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
    html: renderAppointmentConfirmedHtml(request.name, dropoff),
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

// Email clients strip <style> blocks and don't reliably support flex/grid —
// table layout with inline styles is the actual state of the art here, not
// a step backward. PNG logo, not the site's SVG: Outlook's rendering engine
// in particular has poor/no inline SVG support, and "at least have the logo
// on it" is the one thing this absolutely cannot fail silently on.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Inlined as base64, not linked by URL — an <img src="https://..."> pointed
// at this app's own domain would 302 into Vercel's Deployment Protection
// wall for anyone without a Vercel login (confirmed live), and embedding
// the protection-bypass secret in a customer-facing email to work around
// that is a worse trade than the problem it solves. Inlining sidesteps the
// whole question — works regardless of what that setting is ever set to.
//
// NOTE: the OLD logo-email.png asset is still used — just not from this
// file anymore. lib/invoices/pdf.tsx has its own independent reader for
// it (the print-invoice PDF attachment deliberately stayed on the old
// look; the 2026-09-03 rebrand below was scoped to the branded HTML
// emails in this file, not the print invoice/PDF). This file's own
// version of that helper (getLogoDataUri) had no remaining callers once
// renderInvoiceHtml moved to the new brand below, so it was removed
// rather than left as dead code — don't recreate it pointing at the new
// logo by mistake; add a fresh one deliberately instead.

// 2026-09-03 rebrand — new lightning-bolt/checkered-flag logo + colors,
// chosen to match the branding already applied to the Shopify checkout
// page (Settings > Checkout > branding, on Shopify's side, not this
// codebase). Deliberately scoped to these transactional emails per the
// owner's own call, not a site-wide rebrand — the main site nav/footer and the
// print-invoice/PDF keep the original branding untouched.
const BRAND = INVOICE_EMAIL_BRAND;

let cachedNewLogoDataUri: string | null = null;
function getNewBrandLogoDataUri(): string | null {
  if (cachedNewLogoDataUri) return cachedNewLogoDataUri;
  try {
    const filePath = path.join(process.cwd(), "public", "logo-swafford-email.png");
    cachedNewLogoDataUri = `data:image/png;base64,${fs.readFileSync(filePath).toString("base64")}`;
    return cachedNewLogoDataUri;
  } catch (error) {
    console.error("[email] failed to read new-brand logo for inline embedding:", error);
    return null;
  }
}

// Shared chrome for the two rebranded emails — dark header bar with the
// new logo centered (matching the solid dark checkout header, not the old
// white-header-with-black-rule look), then whatever body content the
// caller supplies, then the same footer both emails already used. The
// logo is naturally tall (a lightning bolt, not a wide wordmark) — sized
// down and centered rather than reusing the old wide-logo layout slot.
function renderBrandedEmailShell(bodyHtml: string): string {
  const logoUri = getNewBrandLogoDataUri();
  const logoCell = logoUri
    ? `<img src="${logoUri}" width="56" alt="${escapeHtml(siteConfig.shopName)}" style="display:block;" />`
    : `<div style="font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:15px;letter-spacing:0.08em;color:#ffffff;">${escapeHtml(siteConfig.shopName.toUpperCase())}</div>`;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0eee9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #dddddd;">
        <tr>
          <td align="center" style="padding:26px 32px;background-color:${BRAND.dark};">
            ${logoCell}
          </td>
        </tr>
        ${bodyHtml}
        <tr>
          <td align="center" style="padding:12px 32px 30px;font-size:12px;color:#888888;line-height:1.6;">
            Questions? Call or text ${escapeHtml(siteConfig.phone)}.<br />
            &mdash; ${escapeHtml(siteConfig.shopName)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function invoiceVehicle(invoice: Pick<ServiceInvoiceRow, "vehicleYear" | "vehicleMake" | "vehicleModel">) {
  return [invoice.vehicleYear, invoice.vehicleMake, invoice.vehicleModel]
    .filter(Boolean)
    .join(" ");
}

function renderInvoiceHtml(
  invoice: InvoiceWithJobs,
  payUrl: string | null,
  approveUrl?: string | null,
): string {
  const stage = customerDocumentStage({
    paymentStatus: invoice.paymentStatus,
    documentStage: invoice.documentStage,
    hasPayUrl: Boolean(payUrl),
  });
  return renderBrandedEmailShell(
    renderInvoiceEmailBody({
      invoice,
      vehicle: invoiceVehicle(invoice),
      payUrl,
      stage,
      shopEmail: siteConfig.email,
      approveUrl,
    }),
  );
}

// Pay-path email: Shopify checkout URL is present, so this is always an
// Invoice (never a Quote), even if the in-memory row is still not_sent.
export async function sendInvoiceRepairEmail(invoice: InvoiceWithJobs, payUrl: string) {
  const resend = getResendConfigured();
  if (!resend || !invoice.customerEmail) {
    console.info(
      "[email] skipping branded repair-invoice email (no RESEND_API_KEY or no customer email):",
      invoice.id,
    );
    return;
  }

  const stage = customerDocumentStage({
    paymentStatus: invoice.paymentStatus,
    documentStage: invoice.documentStage,
    hasPayUrl: true,
  });

  await resend.emails.send({
    from: FROM,
    to: invoice.customerEmail,
    subject: customerDocumentEmailSubject({
      stage,
      invoiceNumber: invoice.invoiceNumber,
      shopName: siteConfig.shopName,
      path: "pay",
    }),
    html: renderInvoiceHtml(invoice, payUrl),
    text: [
      ...renderInvoiceEmailText({
        invoice,
        vehicle: invoiceVehicle(invoice),
        payUrl,
        stage,
        approveUrl: null,
      }),
      "",
      `Questions? Call or text ${siteConfig.phone}.`,
      "",
      `— ${siteConfig.shopName}`,
    ].join("\n"),
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
    subject: customerDocumentEmailSubject({
      stage: "paid",
      invoiceNumber: invoice.invoiceNumber,
      shopName: siteConfig.shopName,
      path: "paid",
    }),
    html: renderBrandedEmailShell(
      renderPaidInvoiceEmailBody({
        customerName: invoice.customerName,
        invoiceNumber: invoice.invoiceNumber,
        totalDueCents: invoice.totalDueCents,
      }),
    ),
    text: [
      `INVOICE · #${invoice.invoiceNumber} · PAID`,
      "",
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

// PDF copy email — Quote when still on the quote/approved write-up (and
// paymentStatus is not_sent); Invoice (or Paid) once a pay link has gone
// out or payment landed. Does not itself change paymentStatus. See
// emailInvoiceCopy in app/admin/(dashboard)/invoices/actions.ts.
export async function sendInvoiceCopyEmail(
  invoice: InvoiceWithJobs,
  pdfBuffer: Buffer,
  options?: { approveUrl?: string | null },
) {
  const resend = getResendConfigured();
  if (!resend || !invoice.customerEmail) {
    console.info(
      "[email] skipping invoice-copy email (no RESEND_API_KEY or no customer email):",
      invoice.id,
    );
    return;
  }

  const stage = customerDocumentStage({
    paymentStatus: invoice.paymentStatus,
    documentStage: invoice.documentStage,
  });
  const approveUrl = stage === "quote" ? (options?.approveUrl ?? null) : null;

  await resend.emails.send({
    from: FROM,
    to: invoice.customerEmail,
    subject: customerDocumentEmailSubject({
      stage,
      invoiceNumber: invoice.invoiceNumber,
      shopName: siteConfig.shopName,
      path: "copy",
    }),
    html: renderInvoiceHtml(invoice, null, approveUrl),
    text: [
      ...renderInvoiceEmailText({
        invoice,
        vehicle: invoiceVehicle(invoice),
        payUrl: null,
        stage,
        approveUrl,
      }),
      "",
      `Questions? Call or text ${siteConfig.phone}.`,
      "",
      `— ${siteConfig.shopName}`,
    ].join("\n"),
    attachments: [
      {
        filename: customerDocumentPdfFilename(stage, invoice.invoiceNumber),
        content: pdfBuffer,
      },
    ],
  });
}

export async function sendOwnerIntakeDraftEmail(input: {
  job: JobRow;
  draft: IntakeDraftRow;
}) {
  const resend = getResendConfigured();
  if (!resend || !OWNER_EMAIL) {
    console.warn("[email] OWNER_EMAIL or RESEND_API_KEY missing — logging intake draft instead.");
    console.info("[email] intake draft:", input.job.id, input.job.title);
    return;
  }

  const { job, draft } = input;
  await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `New intake draft — ${job.title}`,
    text: [
      "A screenshot thread was processed into an Open Draft on the job board.",
      "",
      draft.customerName ? `Customer: ${draft.customerName}` : "Customer: (not extracted — fill in before approving)",
      draft.customerPhone ? `Phone: ${draft.customerPhone}` : "Phone: (not extracted — required to approve)",
      draft.customerEmail ? `Email: ${draft.customerEmail}` : null,
      draft.bikeYearMakeModel ? `Bike: ${draft.bikeYearMakeModel}` : null,
      "",
      draft.workNeeded ? `Work needed:\n${draft.workNeeded}` : null,
      draft.conversationSummary ? `Summary:\n${draft.conversationSummary}` : null,
      "",
      `Review & approve: ${SITE_URL}/admin/board/${job.id}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  });
}

export async function sendOwnerQuoteApprovedEmail(invoice: ServiceInvoiceRow) {
  const resend = getResendConfigured();
  if (!resend || !OWNER_EMAIL) {
    console.warn("[email] OWNER_EMAIL or RESEND_API_KEY missing — logging quote approval instead.");
    console.info("[email] quote approved:", invoice.invoiceNumber, invoice.customerName);
    return;
  }

  const vehicle = invoiceVehicle(invoice);
  await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `Quote #${invoice.invoiceNumber} approved by ${invoice.customerName}`,
    text: [
      `Quote #${invoice.invoiceNumber} was approved by ${invoice.customerName}.`,
      "",
      invoice.customerEmail ? `Email: ${invoice.customerEmail}` : null,
      invoice.customerPhone ? `Phone: ${invoice.customerPhone}` : null,
      vehicle ? `Bike: ${vehicle}` : null,
      invoice.approvedVia ? `Via: ${invoice.approvedVia}` : null,
      "",
      `Open invoice: ${SITE_URL}/admin/invoices/${invoice.id}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  });
}
