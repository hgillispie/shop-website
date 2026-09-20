import { createHash, randomBytes } from "node:crypto";
import type { InvoicePaymentStatus, StoredDocumentStage } from "./document-stage";

export const APPROVE_VIA_LINK = "link";

export function createApproveToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashApproveToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function quoteApprovePath(token: string): string {
  return `/quote/${token}/approve`;
}

export function quoteApproveUrl(token: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}${quoteApprovePath(token)}`;
}

export function isQuoteSendPath(invoice: {
  paymentStatus: InvoicePaymentStatus;
  documentStage: StoredDocumentStage;
}): boolean {
  if (invoice.paymentStatus === "paid" || invoice.paymentStatus === "invoice_sent") {
    return false;
  }
  return invoice.documentStage !== "invoice";
}

export function planQuoteApproval(invoice: {
  documentStage: StoredDocumentStage;
  paymentStatus: InvoicePaymentStatus;
  approvedAt: Date | null;
}): {
  alreadyApproved: boolean;
  nextStage: StoredDocumentStage;
  shouldNotify: boolean;
} {
  if (invoice.approvedAt) {
    return {
      alreadyApproved: true,
      nextStage: invoice.documentStage === "quote" ? "approved" : invoice.documentStage,
      shouldNotify: false,
    };
  }

  if (invoice.paymentStatus === "paid") {
    return { alreadyApproved: true, nextStage: "invoice", shouldNotify: false };
  }

  if (invoice.paymentStatus === "invoice_sent" || invoice.documentStage === "invoice") {
    return { alreadyApproved: false, nextStage: "invoice", shouldNotify: true };
  }

  return { alreadyApproved: false, nextStage: "approved", shouldNotify: true };
}
