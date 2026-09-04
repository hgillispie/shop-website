import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { intakeDrafts, jobs, type IntakeDraftRow, type JobRow } from "@/lib/db/schema";
import { isUsablePhone, parseOwnerContactReply } from "@/lib/intake/fields";

export async function latestPendingDraft(): Promise<{
  job: JobRow;
  draft: IntakeDraftRow;
} | null> {
  const draft = await db.query.intakeDrafts.findFirst({
    where: eq(intakeDrafts.status, "pending_review"),
    orderBy: [desc(intakeDrafts.updatedAt)],
    with: { job: true },
  });
  if (!draft?.job || draft.job.status !== "open_draft") return null;
  return { job: draft.job, draft };
}

export async function applyOwnerContactToLatestDraft(text: string): Promise<{
  job: JobRow;
  draft: IntakeDraftRow;
  updated: boolean;
  reason?: string;
} | null> {
  const latest = await latestPendingDraft();
  if (!latest) return null;

  const parsed = parseOwnerContactReply(text);
  const nextPhone = parsed.phone ?? latest.draft.customerPhone;
  const nextEmail = parsed.email ?? latest.draft.customerEmail;

  if (!parsed.phone && !parsed.email && !parsed.acceptedMatch) {
    return { ...latest, updated: false, reason: "no-contact" };
  }
  if (parsed.acceptedMatch && !isUsablePhone(latest.draft.customerPhone) && !parsed.phone) {
    return { ...latest, updated: false, reason: "no-match-to-accept" };
  }

  const [draft] = await db
    .update(intakeDrafts)
    .set({
      customerPhone: isUsablePhone(nextPhone) ? nextPhone : latest.draft.customerPhone,
      customerEmail: nextEmail,
      updatedAt: new Date(),
    })
    .where(eq(intakeDrafts.id, latest.draft.id))
    .returning();

  return { job: latest.job, draft, updated: true };
}
