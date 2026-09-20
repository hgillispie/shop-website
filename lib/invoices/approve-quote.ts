import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { serviceInvoices, type ServiceInvoiceRow } from "@/lib/db/schema";
import { sendOwnerQuoteApprovedEmail } from "@/lib/email";
import { APPROVE_VIA_LINK, hashApproveToken, planQuoteApproval } from "@/lib/invoices/quote-approve";

export type ApproveQuoteResult =
  | { ok: false; reason: "invalid_token" }
  | {
      ok: true;
      alreadyApproved: boolean;
      notified: boolean;
      invoice: ServiceInvoiceRow;
    };

export async function approveQuoteByToken(rawToken: string): Promise<ApproveQuoteResult> {
  const token = rawToken.trim();
  if (!token) return { ok: false, reason: "invalid_token" };

  const invoice = await db.query.serviceInvoices.findFirst({
    where: eq(serviceInvoices.approveTokenHash, hashApproveToken(token)),
  });
  if (!invoice) return { ok: false, reason: "invalid_token" };

  const plan = planQuoteApproval(invoice);
  if (!plan.shouldNotify) {
    return { ok: true, alreadyApproved: true, notified: false, invoice };
  }

  const now = new Date();
  const [updated] = await db
    .update(serviceInvoices)
    .set({
      documentStage: plan.nextStage,
      approvedAt: now,
      approvedVia: invoice.approvedVia ?? APPROVE_VIA_LINK,
      updatedAt: now,
    })
    .where(and(eq(serviceInvoices.id, invoice.id), isNull(serviceInvoices.approvedAt)))
    .returning();

  if (!updated) {
    const latest = await db.query.serviceInvoices.findFirst({
      where: eq(serviceInvoices.id, invoice.id),
    });
    return {
      ok: true,
      alreadyApproved: true,
      notified: false,
      invoice: latest ?? invoice,
    };
  }

  await sendOwnerQuoteApprovedEmail(updated).catch((error) => {
    console.error("[invoices] failed to send quote-approved owner email:", error);
  });

  return { ok: true, alreadyApproved: false, notified: true, invoice: updated };
}
