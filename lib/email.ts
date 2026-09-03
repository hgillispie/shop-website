import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";
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

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

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
// look; the 2026-09-03 rebrand below was scoped to just the two HTML
// emails in this file, not the print invoice/PDF). This file's own
// version of that helper (getLogoDataUri) had no remaining callers once
// renderInvoiceHtml moved to the new brand below, so it was removed
// rather than left as dead code — don't recreate it pointing at the new
// logo by mistake if a third email ever needs branding again; add a
// fresh one deliberately instead.

// 2026-09-03 rebrand — new lightning-bolt/checkered-flag logo + colors,
// chosen to match the branding already applied to the Shopify checkout
// page (Settings > Checkout > branding, on Shopify's side, not this
// codebase). Deliberately scoped to just these two emails per the owner's
// own call, not a site-wide rebrand — the main site nav/footer and the
// print-invoice/PDF keep the original branding untouched.
const BRAND = {
  dark: "#201E1E",
  orange: "#F58220",
  orangeDark: "#EC5407",
};

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

function renderInvoiceHtml(
  invoice: InvoiceWithJobs,
  payUrl: string | null,
  vehicle: string,
): string {
  const e = escapeHtml;

  const jobRows = invoice.jobs
    .map((job, i) => {
      const partRows = job.parts
        .map(
          (part) => `
        <tr>
          <td style="padding:2px 0;font-size:13px;color:#444444;">${part.qty} &times; ${e(part.description || "Part")}</td>
          <td align="right" style="padding:2px 0;font-size:13px;color:#444444;">${money(part.qty * part.unitPriceCents)}</td>
        </tr>`,
        )
        .join("");
      const laborRow =
        job.laborCents > 0
          ? `
        <tr>
          <td style="padding:2px 0;font-size:13px;color:#444444;">Labor</td>
          <td align="right" style="padding:2px 0;font-size:13px;color:#444444;">${money(job.laborCents)}</td>
        </tr>`
          : "";
      return `
      <tr>
        <td style="padding:${i === 0 ? "18" : "14"}px 32px 0;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:bold;color:${BRAND.dark};margin-bottom:6px;">
            Job ${i + 1}: ${e(job.customerDescription || "Repair")}
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${partRows}${laborRow}
          </table>
        </td>
      </tr>`;
    })
    .join("");

  const taxRow =
    invoice.taxCents > 0
      ? `<tr><td style="padding:3px 0;font-size:13px;">Tax</td><td align="right" style="padding:3px 0;font-size:13px;">${money(invoice.taxCents)}</td></tr>`
      : "";
  const ccFeeRow =
    invoice.ccFeeCents > 0
      ? `<tr><td style="padding:3px 0;font-size:13px;">Card processing fee</td><td align="right" style="padding:3px 0;font-size:13px;">${money(invoice.ccFeeCents)}</td></tr>`
      : "";

  const bodyHtml = `
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.1em;color:${BRAND.orange};">
              INVOICE &middot; R.O. #${invoice.invoiceNumber}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 0;font-size:14px;line-height:1.5;color:${BRAND.dark};">
            Hi ${e(invoice.customerName)},<br />
            Here&rsquo;s the invoice for your${vehicle ? ` ${e(vehicle)}` : " bike"}&rsquo;s recent visit${
              invoice.serviceAdvisor ? `, written up by ${e(invoice.serviceAdvisor)}` : ""
            }.
          </td>
        </tr>
        ${jobRows}
        <tr>
          <td style="padding:20px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="color:${BRAND.dark};">
              <tr><td style="padding:3px 0;font-size:13px;">Parts</td><td align="right" style="padding:3px 0;font-size:13px;">${money(invoice.partsTotalCents)}</td></tr>
              <tr><td style="padding:3px 0;font-size:13px;">Labor</td><td align="right" style="padding:3px 0;font-size:13px;">${money(invoice.laborTotalCents)}</td></tr>
              ${taxRow}
              ${ccFeeRow}
              <tr>
                <td style="padding:10px 0 4px;border-top:2px solid ${BRAND.dark};font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:16px;color:${BRAND.dark};">Total due</td>
                <td align="right" style="padding:10px 0 4px;border-top:2px solid ${BRAND.dark};font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:16px;color:${BRAND.dark};">${money(invoice.totalDueCents)}</td>
              </tr>
            </table>
          </td>
        </tr>
        ${
          payUrl
            ? `<tr>
          <td align="center" style="padding:28px 32px 8px;">
            <a href="${payUrl}" style="display:inline-block;background-color:${BRAND.orangeDark};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:999px;">Pay this invoice</a>
          </td>
        </tr>`
            : `<tr>
          <td align="center" style="padding:22px 32px 4px;font-size:12px;color:#888888;">
            A copy of this invoice is attached as a PDF.
          </td>
        </tr>`
        }`;

  return renderBrandedEmailShell(bodyHtml);
}

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
    html: renderInvoiceHtml(invoice, payUrl, vehicle),
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

// "Email a copy" — for a customer who paid in person (or is about to) but
// wants a digital copy of the same invoice for their own records. Reuses
// renderInvoiceHtml with payUrl: null (swaps the "Pay this invoice" button
// for a note pointing at the attached PDF) rather than a second parallel
// template — same visual invoice, different call to action. Deliberately
// independent of paymentStatus/Draft Orders: this can be sent for any
// invoice with a customer email, regardless of how (or whether yet) it's
// been paid. See emailInvoiceCopy in
// app/admin/(dashboard)/invoices/actions.ts and renderInvoicePdf in
// lib/invoices/pdf.tsx for the PDF itself.
export async function sendInvoiceCopyEmail(invoice: InvoiceWithJobs, pdfBuffer: Buffer) {
  const resend = getResendConfigured();
  if (!resend || !invoice.customerEmail) {
    console.info(
      "[email] skipping invoice-copy email (no RESEND_API_KEY or no customer email):",
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
    subject: `Your invoice copy — R.O. #${invoice.invoiceNumber} — ${siteConfig.shopName}`,
    html: renderInvoiceHtml(invoice, null, vehicle),
    text: [
      `Hi ${invoice.customerName},`,
      "",
      `Here's a copy of the invoice for your${vehicle ? ` ${vehicle}` : " bike"}'s recent visit${
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
      "A copy of this invoice is attached as a PDF.",
      "",
      `Questions? Call or text ${siteConfig.phone}.`,
      "",
      `— ${siteConfig.shopName}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
