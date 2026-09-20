import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  adminDocumentStage,
  customerDocumentEmailSubject,
  customerDocumentIntro,
  customerDocumentLabels,
  customerDocumentPdfFilename,
  customerDocumentStage,
  quoteApproveMailto,
  renderInvoiceEmailBody,
  renderInvoiceEmailText,
  renderPaidInvoiceEmailBody,
  type InvoiceEmailModel,
} from "./document-stage.ts";

const sampleInvoice: InvoiceEmailModel = {
  invoiceNumber: 42,
  customerName: "Hunter",
  serviceAdvisor: "Matt",
  taxCents: 0,
  ccFeeCents: 0,
  partsTotalCents: 10000,
  laborTotalCents: 20000,
  totalDueCents: 30000,
  jobs: [
    {
      customerDescription: "Cam swap",
      laborCents: 20000,
      parts: [{ qty: 1, description: "Cam kit", unitPriceCents: 10000 }],
    },
  ],
};

describe("customerDocumentStage", () => {
  it("treats the copy/PDF path as a quote when payment is not_sent", () => {
    assert.equal(customerDocumentStage({ paymentStatus: "not_sent" }), "quote");
  });

  it("treats a pay URL as an invoice even if the row is still not_sent", () => {
    assert.equal(
      customerDocumentStage({ paymentStatus: "not_sent", hasPayUrl: true }),
      "invoice",
    );
  });

  it("treats invoice_sent copy/PDF as an invoice", () => {
    assert.equal(customerDocumentStage({ paymentStatus: "invoice_sent" }), "invoice");
  });

  it("treats paid as paid, including copy/PDF", () => {
    assert.equal(customerDocumentStage({ paymentStatus: "paid" }), "paid");
  });

  it("keeps approved quotes as quotes for the customer until a pay link goes out", () => {
    assert.equal(
      customerDocumentStage({ paymentStatus: "not_sent", documentStage: "approved" }),
      "quote",
    );
  });

  it("treats stored documentStage=invoice as an invoice even if payment is still not_sent", () => {
    assert.equal(
      customerDocumentStage({ paymentStatus: "not_sent", documentStage: "invoice" }),
      "invoice",
    );
  });

  it("lets paid win over a leftover pay URL", () => {
    assert.equal(
      customerDocumentStage({
        paymentStatus: "paid",
        documentStage: "invoice",
        hasPayUrl: true,
      }),
      "paid",
    );
  });
});

describe("adminDocumentStage", () => {
  it("maps quote / approved / invoice / paid for the shop badge", () => {
    assert.equal(
      adminDocumentStage({ paymentStatus: "not_sent", documentStage: "quote" }),
      "quote",
    );
    assert.equal(
      adminDocumentStage({ paymentStatus: "not_sent", documentStage: "approved" }),
      "approved",
    );
    assert.equal(
      adminDocumentStage({ paymentStatus: "invoice_sent", documentStage: "quote" }),
      "invoice",
    );
    assert.equal(
      adminDocumentStage({ paymentStatus: "paid", documentStage: "approved" }),
      "paid",
    );
  });
});

describe("customer-facing labels", () => {
  it("stamps quotes QUOTE — NOT PAID with estimated total", () => {
    const labels = customerDocumentLabels("quote", 42);
    assert.equal(labels.headerText, "QUOTE · #42");
    assert.equal(labels.banner, "QUOTE — NOT PAID");
    assert.equal(labels.totalLabel, "Estimated total");
    assert.equal(labels.docTitle, "QUOTE");
    assert.equal(labels.numberLabel, "QUOTE NUMBER");
    assert.equal(customerDocumentPdfFilename("quote", 42), "quote-42.pdf");
  });

  it("labels the pay path as Invoice with total due", () => {
    const labels = customerDocumentLabels("invoice", 42);
    assert.equal(labels.headerText, "INVOICE · #42");
    assert.equal(labels.banner, null);
    assert.equal(labels.totalLabel, "Total due");
    assert.equal(labels.numberLabel, "INVOICE NUMBER");
    assert.equal(customerDocumentPdfFilename("invoice", 42), "invoice-42.pdf");
  });

  it("labels paid as Invoice · PAID", () => {
    const labels = customerDocumentLabels("paid", 42);
    assert.equal(labels.headerText, "INVOICE · #42 · PAID");
    assert.equal(labels.totalLabel, "Total paid");
  });

  it("uses estimate language on quotes, not recent-visit invoice copy", () => {
    const quote = customerDocumentIntro({
      stage: "quote",
      vehicle: "2018 Road King",
      serviceAdvisor: "Matt",
    });
    assert.match(quote, /estimate/i);
    assert.match(quote, /not paid/i);
    assert.doesNotMatch(quote, /recent visit/i);
    assert.doesNotMatch(quote, /invoice/i);

    const invoice = customerDocumentIntro({
      stage: "invoice",
      vehicle: "2018 Road King",
      serviceAdvisor: "Matt",
    });
    assert.match(invoice, /invoice/i);
    assert.match(invoice, /recent visit/i);
  });

  it("keeps Quote / Invoice in subjects and never R.O.", () => {
    const quote = customerDocumentEmailSubject({
      stage: "quote",
      invoiceNumber: 7,
      shopName: "Swafford Speed",
      path: "copy",
    });
    const pay = customerDocumentEmailSubject({
      stage: "invoice",
      invoiceNumber: 7,
      shopName: "Swafford Speed",
      path: "pay",
    });
    const paid = customerDocumentEmailSubject({
      stage: "paid",
      invoiceNumber: 7,
      shopName: "Swafford Speed",
      path: "paid",
    });
    assert.equal(quote, "Your quote from Swafford Speed — Quote #7");
    assert.equal(pay, "Your invoice from Swafford Speed — Invoice #7");
    assert.equal(paid, "Payment received — Invoice #7 — Swafford Speed");
    for (const subject of [quote, pay, paid]) {
      assert.doesNotMatch(subject, /R\.O\./);
    }
  });

  it("builds a mailto approve link for quotes", () => {
    const href = quoteApproveMailto("swaffordspeed@gmail.com", 12);
    assert.equal(href.startsWith("mailto:swaffordspeed@gmail.com?"), true);
    assert.match(href, /Approve%20Quote%20%2312/);
    assert.match(href, /body=YES/);
  });
});

describe("customer-facing invoice surfaces have no R.O.", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const files = [
    "lib/email.ts",
    "lib/invoices/document-stage.ts",
    "lib/invoices/quote-approve.ts",
    "lib/invoices/approve-quote.ts",
    "lib/invoices/pdf.tsx",
    "app/quote/[token]/approve/page.tsx",
    "app/admin/invoices/[id]/print/page.tsx",
    "app/admin/(dashboard)/invoices/shopify-actions.ts",
    "app/admin/(dashboard)/invoices/[id]/pdf/route.ts",
  ];

  for (const file of files) {
    it(`${file} does not show R.O. to customers`, () => {
      const src = readFileSync(join(root, file), "utf8");
      assert.doesNotMatch(src, /R\.O\./, `${file} still contains R.O.`);
    });
  }
});

describe("quote vs invoice email bodies", () => {
  it("stamps the copy path QUOTE — NOT PAID with an Approve this quote link", () => {
    const html = renderInvoiceEmailBody({
      invoice: sampleInvoice,
      vehicle: "2018 Road King",
      payUrl: null,
      stage: "quote",
      shopEmail: "swaffordspeed@gmail.com",
      approveUrl: "https://swaffordspeed.com/quote/tok_abc/approve",
    });
    const text = renderInvoiceEmailText({
      invoice: sampleInvoice,
      vehicle: "2018 Road King",
      payUrl: null,
      stage: "quote",
      approveUrl: "https://swaffordspeed.com/quote/tok_abc/approve",
    }).join("\n");

    assert.match(html, /QUOTE &middot; #42/);
    assert.match(html, /QUOTE — NOT PAID/);
    assert.match(html, /Estimated total/);
    assert.match(html, /estimate/);
    assert.match(html, /Approve this quote/);
    assert.match(html, /https:\/\/swaffordspeed\.com\/quote\/tok_abc\/approve/);
    assert.match(html, /Or reply YES to this email to approve the work/);
    assert.doesNotMatch(html, /mailto:/);
    assert.doesNotMatch(html, /Pay this invoice/);
    assert.doesNotMatch(html, /recent visit/);
    assert.doesNotMatch(html, /R\.O\./);
    assert.match(text, /QUOTE — NOT PAID/);
    assert.match(text, /Approve this quote: https:\/\/swaffordspeed\.com\/quote\/tok_abc\/approve/);
    assert.match(text, /Estimated total: \$300\.00/);
    assert.doesNotMatch(text, /R\.O\./);
  });

  it("falls back to mailto Reply YES when no approve URL is provided", () => {
    const html = renderInvoiceEmailBody({
      invoice: sampleInvoice,
      vehicle: "2018 Road King",
      payUrl: null,
      stage: "quote",
      shopEmail: "swaffordspeed@gmail.com",
    });
    assert.match(html, /Reply YES to approve/);
    assert.match(html, /mailto:swaffordspeed@gmail.com/);
  });

  it("keeps the pay path as an invoice with Pay this invoice", () => {
    const html = renderInvoiceEmailBody({
      invoice: sampleInvoice,
      vehicle: "2018 Road King",
      payUrl: "https://checkout.shopify.com/pay",
      stage: "invoice",
      shopEmail: "swaffordspeed@gmail.com",
    });
    assert.match(html, /INVOICE &middot; #42/);
    assert.match(html, /Pay this invoice/);
    assert.match(html, /Total due/);
    assert.match(html, /recent visit/);
    assert.match(html, /https:\/\/checkout\.shopify\.com\/pay/);
    assert.doesNotMatch(html, /QUOTE — NOT PAID/);
    assert.doesNotMatch(html, /R\.O\./);
  });

  it("renders paid confirmation as INVOICE · PAID with no R.O.", () => {
    const html = renderPaidInvoiceEmailBody({
      customerName: "Hunter",
      invoiceNumber: 42,
      totalDueCents: 30000,
    });
    assert.match(html, /INVOICE &middot; #42 &middot; PAID/);
    assert.match(html, /Total paid/);
    assert.doesNotMatch(html, /R\.O\./);
    assert.doesNotMatch(html, /Pay this invoice/);
  });
});
