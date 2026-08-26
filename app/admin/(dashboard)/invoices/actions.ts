"use server";

import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { serviceInvoiceJobs, serviceInvoicePartsLines, serviceInvoices } from "@/lib/db/schema";
import { getServiceInvoiceById } from "@/lib/db/queries";
import { computeInvoiceTotals } from "@/lib/invoices/totals";
import { renderInvoicePdf } from "@/lib/invoices/pdf";
import { sendInvoiceCopyEmail } from "@/lib/email";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations/invoices";

// A Server Action is a POST endpoint in its own right, reachable
// independent of which page renders its caller — same posture as
// terminal/actions.ts, so every action here checks explicitly too, on top
// of the page-level session gate in middleware.ts.
async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
  return session;
}

// Plain Errors rather than letting a ZodError cross the Server Action
// boundary — Next redacts server-error detail in production, so a
// validation message needs to already be a plain Error to survive that.
function parseInvoice(input: unknown): InvoiceInput {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid invoice.");
  }
  return parsed.data;
}

function invoiceColumns(data: InvoiceInput) {
  return {
    serviceAdvisor: data.serviceAdvisor || null,
    dateWritten: data.dateWritten,
    customerName: data.customerName,
    customerAddress: data.customerAddress || null,
    customerCityStateZip: data.customerCityStateZip || null,
    customerPhone: data.customerPhone || null,
    customerEmail: data.customerEmail || null,
    vehicleYear: data.vehicleYear || null,
    vehicleMake: data.vehicleMake || null,
    vehicleModel: data.vehicleModel || null,
    vehicleColor: data.vehicleColor || null,
    vehicleVin: data.vehicleVin || null,
    licensePlate: data.licensePlate || null,
    mileageIn: data.mileageIn || null,
    odometerOut: data.odometerOut || null,
    // Drizzle's `numeric` columns are typed as strings (Postgres numeric
    // isn't safely representable as a JS float) — converted here, at the
    // one boundary that writes them, rather than scattering toFixed calls.
    taxRatePercent: data.taxRatePercent.toFixed(3),
    taxAppliesToParts: data.taxAppliesToParts,
    taxAppliesToLabor: data.taxAppliesToLabor,
    ccFeeEnabled: data.ccFeeEnabled,
    ccFeeRatePercent: data.ccFeeRatePercent.toFixed(3),
  };
}

// Drizzle's neon-http driver has no interactive transactions (only the
// websocket/Pool driver does) — the same constraint terminal/actions.ts
// already lives with, via sequential awaited writes instead of
// db.transaction(...). Full replace rather than diffing the jobs/parts
// tree is the simplest correct approach for a dynamic add/remove form with
// exactly one editor at a time; low risk if a save fails partway, since
// there's no money movement blocked on it and the invoice is always
// safely re-editable afterward.
async function writeJobsAndParts(invoiceId: string, jobs: InvoiceInput["jobs"]) {
  await db.delete(serviceInvoiceJobs).where(eq(serviceInvoiceJobs.invoiceId, invoiceId));

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const [createdJob] = await db
      .insert(serviceInvoiceJobs)
      .values({
        invoiceId,
        position: i,
        techInitials: job.techInitials || null,
        customerDescription: job.customerDescription || null,
        technicianFindings: job.technicianFindings || null,
        correctionPerformed: job.correctionPerformed || null,
        laborCents: job.laborCents,
      })
      .returning();

    if (job.parts.length > 0) {
      await db.insert(serviceInvoicePartsLines).values(
        job.parts.map((part, j) => ({
          invoiceJobId: createdJob.id,
          position: j,
          description: part.description,
          qty: part.qty,
          unitPriceCents: part.unitPriceCents,
        })),
      );
    }
  }
}

export async function createInvoice(input: unknown) {
  await requireSession();
  const data = parseInvoice(input);
  const totals = computeInvoiceTotals(data);

  const [created] = await db
    .insert(serviceInvoices)
    .values({ ...invoiceColumns(data), ...totals })
    .returning();

  await writeJobsAndParts(created.id, data.jobs);

  return { id: created.id };
}

export async function updateInvoice(id: string, input: unknown) {
  await requireSession();
  const data = parseInvoice(input);
  const totals = computeInvoiceTotals(data);

  await db
    .update(serviceInvoices)
    .set({ ...invoiceColumns(data), ...totals, updatedAt: new Date() })
    .where(eq(serviceInvoices.id, id));

  await writeJobsAndParts(id, data.jobs);

  return { id };
}

export async function deleteInvoice(id: string) {
  await requireSession();
  // Cascades to serviceInvoiceJobs -> serviceInvoicePartsLines (onDelete:
  // "cascade" in lib/db/schema.ts) — one statement is enough.
  await db.delete(serviceInvoices).where(eq(serviceInvoices.id, id));
  return { ok: true };
}

// Deliberately separate from shopify-actions.ts's sendInvoiceToShopify —
// this doesn't touch paymentStatus, doesn't create a Draft Order, and
// isn't gated on Shopify at all. It's for the "customer paid in person (or
// will) but wants a digital copy for their own records" case: render the
// same invoice as a PDF and email it as an attachment, full stop.
export async function emailInvoiceCopy(invoiceId: string) {
  await requireSession();

  const invoice = await getServiceInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice not found.");
  if (!invoice.customerEmail) {
    throw new Error("Add a customer email to this invoice before emailing a copy.");
  }

  const pdfBuffer = await renderInvoicePdf(invoice);
  await sendInvoiceCopyEmail(invoice, pdfBuffer);

  return { ok: true };
}
