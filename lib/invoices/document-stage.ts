// Customer-facing document stage for the same serial invoiceNumber.
// Shop staff still talk about repair orders; customers see Quote vs Invoice
// (Harley parts-counter "quote not paid" stamp — same write-up, different
// stage word). No second numbering scheme, no extra DB enum: map the
// existing send paths + paymentStatus.
//
//   sendInvoiceCopyEmail / PDF / print, paymentStatus = not_sent
//     → Quote — not paid
//   sendInvoiceRepairEmail (payUrl present) or paymentStatus = invoice_sent
//     → Invoice
//   sendInvoicePaidEmail / paymentStatus = paid
//     → Invoice · PAID
//
// hasPayUrl wins over a stale in-memory paymentStatus: shopify-actions.ts
// sends the branded pay email with the pre-update row (still "not_sent").

export type InvoicePaymentStatus = "not_sent" | "invoice_sent" | "paid";
export type CustomerDocumentStage = "quote" | "invoice" | "paid";

export function customerDocumentStage(input: {
  paymentStatus: InvoicePaymentStatus;
  hasPayUrl?: boolean;
}): CustomerDocumentStage {
  if (input.hasPayUrl) return "invoice";
  if (input.paymentStatus === "paid") return "paid";
  if (input.paymentStatus === "invoice_sent") return "invoice";
  return "quote";
}

export type CustomerDocumentLabels = {
  stage: CustomerDocumentStage;
  headerText: string;
  headerHtml: string;
  banner: string | null;
  docTitle: string;
  numberLabel: string;
  totalLabel: string;
  pdfFilename: string;
  pdfTitle: string;
};

export function customerDocumentLabels(
  stage: CustomerDocumentStage,
  invoiceNumber: number,
): CustomerDocumentLabels {
  const n = String(invoiceNumber);
  switch (stage) {
    case "quote":
      return {
        stage,
        headerText: `QUOTE · #${n}`,
        headerHtml: `QUOTE &middot; #${n}`,
        banner: "QUOTE — NOT PAID",
        docTitle: "QUOTE",
        numberLabel: "QUOTE NUMBER",
        totalLabel: "Estimated total",
        pdfFilename: `quote-${n}.pdf`,
        pdfTitle: `Quote ${n}`,
      };
    case "invoice":
      return {
        stage,
        headerText: `INVOICE · #${n}`,
        headerHtml: `INVOICE &middot; #${n}`,
        banner: null,
        docTitle: "INVOICE",
        numberLabel: "INVOICE NUMBER",
        totalLabel: "Total due",
        pdfFilename: `invoice-${n}.pdf`,
        pdfTitle: `Invoice ${n}`,
      };
    case "paid":
      return {
        stage,
        headerText: `INVOICE · #${n} · PAID`,
        headerHtml: `INVOICE &middot; #${n} &middot; PAID`,
        banner: "PAID",
        docTitle: "INVOICE",
        numberLabel: "INVOICE NUMBER",
        totalLabel: "Total paid",
        pdfFilename: `invoice-${n}.pdf`,
        pdfTitle: `Invoice ${n} — Paid`,
      };
  }
}

export function customerDocumentEmailSubject(input: {
  stage: CustomerDocumentStage;
  invoiceNumber: number;
  shopName: string;
  path: "pay" | "copy" | "paid";
}): string {
  const n = input.invoiceNumber;
  const shop = input.shopName;
  if (input.path === "paid" || input.stage === "paid") {
    return `Payment received — Invoice #${n} — ${shop}`;
  }
  if (input.stage === "quote") {
    return `Your quote from ${shop} — Quote #${n}`;
  }
  if (input.path === "copy") {
    return `Your invoice copy — Invoice #${n} — ${shop}`;
  }
  return `Your invoice from ${shop} — Invoice #${n}`;
}

export function customerDocumentIntro(input: {
  stage: CustomerDocumentStage;
  vehicle: string;
  serviceAdvisor: string | null;
}): string {
  const bike = input.vehicle ? input.vehicle : "bike";
  const advisor = input.serviceAdvisor
    ? `, written up by ${input.serviceAdvisor}`
    : "";

  switch (input.stage) {
    case "quote":
      return `Here's an estimate for your ${bike}${advisor}. This is a quote — not paid.`;
    case "invoice":
      return `Here's the invoice for your ${bike}'s recent visit${advisor}.`;
    case "paid":
      return `We've received your payment for your ${bike}${advisor} — thank you.`;
  }
}

export const QUOTE_APPROVE_HINT = "Reply YES to this email to approve the work.";
export const QUOTE_APPROVE_CTA = "Reply YES to approve";
export const INVOICE_PAY_CTA = "Pay this invoice";

export function quoteApproveMailto(shopEmail: string, invoiceNumber: number): string {
  const subject = encodeURIComponent(`Approve Quote #${invoiceNumber}`);
  const body = encodeURIComponent("YES");
  return `mailto:${shopEmail}?subject=${subject}&body=${body}`;
}

export function customerDocumentPdfFilename(
  stage: CustomerDocumentStage,
  invoiceNumber: number,
): string {
  return customerDocumentLabels(stage, invoiceNumber).pdfFilename;
}

// Email body HTML — same brand tokens as lib/email.ts's shell. Kept in this
// module (no @/ imports) so node:test can render Quote vs Invoice without
// spinning up Resend or the branded logo file reader.
export const INVOICE_EMAIL_BRAND = {
  dark: "#201E1E",
  orange: "#F58220",
  orangeDark: "#EC5407",
  bone: "#fdf1e7",
} as const;

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type InvoiceEmailJob = {
  customerDescription: string | null;
  laborCents: number;
  parts: { qty: number; description: string | null; unitPriceCents: number }[];
};

export type InvoiceEmailModel = {
  invoiceNumber: number;
  customerName: string;
  serviceAdvisor: string | null;
  taxCents: number;
  ccFeeCents: number;
  partsTotalCents: number;
  laborTotalCents: number;
  totalDueCents: number;
  jobs: InvoiceEmailJob[];
};

function renderJobRows(jobs: InvoiceEmailJob[], brandDark: string): string {
  const e = escapeHtml;
  return jobs
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
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:bold;color:${brandDark};margin-bottom:6px;">
            Job ${i + 1}: ${e(job.customerDescription || "Repair")}
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${partRows}${laborRow}
          </table>
        </td>
      </tr>`;
    })
    .join("");
}

function renderTotals(invoice: InvoiceEmailModel, totalLabel: string, brandDark: string): string {
  const taxRow =
    invoice.taxCents > 0
      ? `<tr><td style="padding:3px 0;font-size:13px;">Tax</td><td align="right" style="padding:3px 0;font-size:13px;">${money(invoice.taxCents)}</td></tr>`
      : "";
  const ccFeeRow =
    invoice.ccFeeCents > 0
      ? `<tr><td style="padding:3px 0;font-size:13px;">Card processing fee</td><td align="right" style="padding:3px 0;font-size:13px;">${money(invoice.ccFeeCents)}</td></tr>`
      : "";

  return `
        <tr>
          <td style="padding:20px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="color:${brandDark};">
              <tr><td style="padding:3px 0;font-size:13px;">Parts</td><td align="right" style="padding:3px 0;font-size:13px;">${money(invoice.partsTotalCents)}</td></tr>
              <tr><td style="padding:3px 0;font-size:13px;">Labor</td><td align="right" style="padding:3px 0;font-size:13px;">${money(invoice.laborTotalCents)}</td></tr>
              ${taxRow}
              ${ccFeeRow}
              <tr>
                <td style="padding:10px 0 4px;border-top:2px solid ${brandDark};font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:16px;color:${brandDark};">${escapeHtml(totalLabel)}</td>
                <td align="right" style="padding:10px 0 4px;border-top:2px solid ${brandDark};font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:16px;color:${brandDark};">${money(invoice.totalDueCents)}</td>
              </tr>
            </table>
          </td>
        </tr>`;
}

function renderStamp(banner: string): string {
  const brand = INVOICE_EMAIL_BRAND;
  return `
        <tr>
          <td style="padding:16px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${brand.bone};border:2px solid ${brand.orange};">
              <tr>
                <td align="center" style="padding:12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.14em;color:${brand.orangeDark};">
                  ${escapeHtml(banner)}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
}

function renderCta(input: {
  stage: CustomerDocumentStage;
  payUrl: string | null;
  invoiceNumber: number;
  shopEmail: string;
}): string {
  const brand = INVOICE_EMAIL_BRAND;
  if (input.payUrl) {
    return `<tr>
          <td align="center" style="padding:28px 32px 8px;">
            <a href="${escapeHtml(input.payUrl)}" style="display:inline-block;background-color:${brand.orangeDark};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:999px;">${INVOICE_PAY_CTA}</a>
          </td>
        </tr>`;
  }

  if (input.stage === "quote") {
    const mailto = quoteApproveMailto(input.shopEmail, input.invoiceNumber);
    return `<tr>
          <td align="center" style="padding:22px 32px 4px;">
            <a href="${escapeHtml(mailto)}" style="display:inline-block;background-color:${brand.dark};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:999px;">${QUOTE_APPROVE_CTA}</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:10px 32px 4px;font-size:12px;color:#888888;">
            ${escapeHtml(QUOTE_APPROVE_HINT)} A copy of this quote is attached as a PDF.
          </td>
        </tr>`;
  }

  return `<tr>
          <td align="center" style="padding:22px 32px 4px;font-size:12px;color:#888888;">
            A copy of this invoice is attached as a PDF.
          </td>
        </tr>`;
}

// Inner rows only — lib/email.ts wraps with the branded shell (logo + footer).
export function renderInvoiceEmailBody(input: {
  invoice: InvoiceEmailModel;
  vehicle: string;
  payUrl: string | null;
  stage: CustomerDocumentStage;
  shopEmail: string;
}): string {
  const e = escapeHtml;
  const brand = INVOICE_EMAIL_BRAND;
  const labels = customerDocumentLabels(input.stage, input.invoice.invoiceNumber);
  const intro = customerDocumentIntro({
    stage: input.stage,
    vehicle: input.vehicle,
    serviceAdvisor: input.invoice.serviceAdvisor,
  });
  const stamp = labels.banner ? renderStamp(labels.banner) : "";

  return `
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.1em;color:${brand.orange};">
              ${labels.headerHtml}
            </div>
          </td>
        </tr>
        ${stamp}
        <tr>
          <td style="padding:8px 32px 0;font-size:14px;line-height:1.5;color:${brand.dark};">
            Hi ${e(input.invoice.customerName)},<br />
            ${e(intro)}
          </td>
        </tr>
        ${renderJobRows(input.invoice.jobs, brand.dark)}
        ${renderTotals(input.invoice, labels.totalLabel, brand.dark)}
        ${renderCta({
          stage: input.stage,
          payUrl: input.payUrl,
          invoiceNumber: input.invoice.invoiceNumber,
          shopEmail: input.shopEmail,
        })}`;
}

export function renderPaidInvoiceEmailBody(input: {
  customerName: string;
  invoiceNumber: number;
  totalDueCents: number;
}): string {
  const e = escapeHtml;
  const brand = INVOICE_EMAIL_BRAND;
  const labels = customerDocumentLabels("paid", input.invoiceNumber);
  return `
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.1em;color:${brand.orange};">
              ${labels.headerHtml}
            </div>
          </td>
        </tr>
        ${renderStamp(labels.banner ?? "PAID")}
        <tr>
          <td style="padding:8px 32px 0;font-size:14px;line-height:1.5;color:${brand.dark};">
            Hi ${e(input.customerName)},<br />
            We&rsquo;ve received your payment for invoice #${input.invoiceNumber} &mdash; thank you.
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="color:${brand.dark};">
              <tr>
                <td style="padding:10px 0 4px;border-top:2px solid ${brand.dark};font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:16px;color:${brand.dark};">${e(labels.totalLabel)}</td>
                <td align="right" style="padding:10px 0 4px;border-top:2px solid ${brand.dark};font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:16px;color:${brand.dark};">${money(input.totalDueCents)}</td>
              </tr>
            </table>
          </td>
        </tr>`;
}

export function renderInvoiceEmailText(input: {
  invoice: InvoiceEmailModel;
  vehicle: string;
  payUrl: string | null;
  stage: CustomerDocumentStage;
}): string[] {
  const labels = customerDocumentLabels(input.stage, input.invoice.invoiceNumber);
  const intro = customerDocumentIntro({
    stage: input.stage,
    vehicle: input.vehicle,
    serviceAdvisor: input.invoice.serviceAdvisor,
  });

  const jobLines = input.invoice.jobs.flatMap((job, i) => {
    const heading = `Job ${i + 1}: ${job.customerDescription || "Repair"}`;
    const partsLines = job.parts.map(
      (part) =>
        `    ${part.qty} x ${part.description || "Part"} — ${money(part.qty * part.unitPriceCents)}`,
    );
    const laborLine = job.laborCents > 0 ? `    Labor — ${money(job.laborCents)}` : null;
    return [heading, ...partsLines, laborLine, ""].filter((line): line is string => line !== null);
  });

  const ctaLines = input.payUrl
    ? [`Pay online: ${input.payUrl}`]
    : input.stage === "quote"
      ? [QUOTE_APPROVE_HINT, "A copy of this quote is attached as a PDF."]
      : ["A copy of this invoice is attached as a PDF."];

  return [
    labels.headerText,
    input.stage === "quote" && labels.banner ? labels.banner : null,
    "",
    `Hi ${input.invoice.customerName},`,
    "",
    intro,
    "",
    ...jobLines,
    `Parts: ${money(input.invoice.partsTotalCents)}`,
    `Labor: ${money(input.invoice.laborTotalCents)}`,
    input.invoice.taxCents > 0 ? `Tax: ${money(input.invoice.taxCents)}` : null,
    input.invoice.ccFeeCents > 0
      ? `Card processing fee: ${money(input.invoice.ccFeeCents)}`
      : null,
    `${labels.totalLabel}: ${money(input.invoice.totalDueCents)}`,
    "",
    ...ctaLines,
  ].filter((line): line is string => line !== null);
}
