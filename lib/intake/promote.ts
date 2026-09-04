import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  intakeDrafts,
  jobs,
  jobStatusEnum,
  type IntakeDraftRow,
} from "@/lib/db/schema";
import { createTicketForRequest, findOrCreateCustomer } from "@/lib/crm";
import { saveExtractedQuotes } from "@/lib/crm/quotes";
import { refreshCustomerHealth } from "@/lib/crm/health-sync";
import {
  blankToNull,
  draftJobDescription,
  draftJobTitle,
  isUsablePhone,
} from "@/lib/intake/fields";

export type LiveJobStatus = Exclude<(typeof jobStatusEnum.enumValues)[number], "open_draft">;

export type DraftFieldInput = {
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  bikeYearMakeModel?: string | null;
  workNeeded?: string | null;
  conversationSummary?: string | null;
};

export class IntakePromoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntakePromoteError";
  }
}

export async function promoteIntakeDraft(
  jobId: string,
  destination: LiveJobStatus,
  fields?: DraftFieldInput,
) {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
    with: { intakeDraft: true },
  });
  if (!job) throw new IntakePromoteError("Job not found.");

  const draft = job.intakeDraft;
  if (!draft || job.status !== "open_draft") {
    await db
      .update(jobs)
      .set({ status: destination, updatedAt: new Date() })
      .where(eq(jobs.id, jobId));
    return;
  }

  const next = mergeDraftFields(draft, fields);
  if (!next.customerName) {
    throw new IntakePromoteError("Add the customer name before approving this draft.");
  }
  if (!isUsablePhone(next.customerPhone)) {
    throw new IntakePromoteError("Add a valid customer phone before approving this draft.");
  }

  const customer = await findOrCreateCustomer({
    name: next.customerName,
    phone: next.customerPhone,
    email: next.customerEmail,
    source: "email_intake",
  });

  const title = draftJobTitle({
    bikeYearMakeModel: next.bikeYearMakeModel,
    customerName: next.customerName,
    subject: draft.subject,
  });
  const description = draftJobDescription({
    workNeeded: next.workNeeded,
    conversationSummary: next.conversationSummary,
    bodyText: draft.bodyText,
  });

  await db
    .update(jobs)
    .set({
      customerId: customer.id,
      title,
      description,
      status: destination,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  await createTicketForRequest({
    customerId: customer.id,
    jobId,
    subject: title,
    details: description,
  });

  await db
    .update(intakeDrafts)
    .set({
      customerName: next.customerName,
      customerPhone: next.customerPhone,
      customerEmail: next.customerEmail,
      bikeYearMakeModel: next.bikeYearMakeModel,
      workNeeded: next.workNeeded,
      conversationSummary: next.conversationSummary,
      status: "approved",
      updatedAt: new Date(),
    })
    .where(eq(intakeDrafts.id, draft.id));

  await saveExtractedQuotes({
    customerId: customer.id,
    intakeDraftId: draft.id,
    source: draft.source === "telegram" ? "telegram" : "intake",
    positiveQuotes: draft.extracted?.positiveQuotes ?? [],
    negativeQuotes: draft.extracted?.negativeQuotes ?? [],
  });
  await refreshCustomerHealth(customer.id);
}

function mergeDraftFields(draft: IntakeDraftRow, fields?: DraftFieldInput) {
  return {
    customerName: blankToNull(fields?.customerName) ?? draft.customerName,
    customerPhone: blankToNull(fields?.customerPhone) ?? draft.customerPhone,
    customerEmail: blankToNull(fields?.customerEmail) ?? draft.customerEmail,
    bikeYearMakeModel: blankToNull(fields?.bikeYearMakeModel) ?? draft.bikeYearMakeModel,
    workNeeded: blankToNull(fields?.workNeeded) ?? draft.workNeeded,
    conversationSummary: blankToNull(fields?.conversationSummary) ?? draft.conversationSummary,
  };
}
