import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { intakeDrafts, jobs, type IntakeDraftRow, type IntakeExtraction, type JobRow } from "@/lib/db/schema";
import { sendOwnerIntakeDraftEmail } from "@/lib/email";
import { extractIntakeFromScreenshots } from "@/lib/intake/extract";
import { draftJobDescription, draftJobTitle } from "@/lib/intake/fields";
import { uploadIntakeImages } from "@/lib/storage";

export type IntakeImage = {
  bytes: Buffer;
  filename: string;
  contentType: string;
};

export type CaptureInput = {
  source: "email" | "telegram";
  resendEmailId?: string | null;
  telegramMediaGroupId?: string | null;
  fromEmail?: string | null;
  subject?: string | null;
  bodyText?: string | null;
  fallbackName?: string | null;
  images: IntakeImage[];
};

export async function saveIntakeCapture(input: CaptureInput): Promise<{
  job: JobRow;
  draft: IntakeDraftRow;
  appended: boolean;
}> {
  if (input.resendEmailId) {
    const existing = await db.query.intakeDrafts.findFirst({
      where: eq(intakeDrafts.resendEmailId, input.resendEmailId),
      with: { job: true },
    });
    if (existing?.job) {
      return { job: existing.job, draft: existing, appended: true };
    }
  }

  if (input.telegramMediaGroupId) {
    const existing = await db.query.intakeDrafts.findFirst({
      where: eq(intakeDrafts.telegramMediaGroupId, input.telegramMediaGroupId),
      with: { job: true },
    });
    if (existing?.job && existing.status === "pending_review") {
      return appendToDraft(existing.job, existing, input);
    }
  }

  return createDraft(input);
}

async function uploadImages(images: IntakeImage[]): Promise<string[]> {
  if (images.length === 0) return [];
  try {
    return await uploadIntakeImages(images);
  } catch (error) {
    console.error("[intake] blob upload failed:", error);
    return [];
  }
}

function visionUrls(uploaded: string[], images: IntakeImage[]): string[] {
  if (uploaded.length > 0) return uploaded;
  return images.map((file) => `data:${file.contentType};base64,${file.bytes.toString("base64")}`);
}

async function extractFields(input: CaptureInput, imageUrls: string[]): Promise<IntakeExtraction> {
  const extracted = await extractIntakeFromScreenshots({
    bodyText: input.bodyText ?? "",
    subject: input.subject ?? null,
    imageUrls,
  });

  return {
    customerName: extracted?.customerName ?? input.fallbackName ?? null,
    phone: extracted?.phone ?? null,
    email: extracted?.email ?? null,
    bikeYearMakeModel: extracted?.bikeYearMakeModel ?? null,
    workNeeded: extracted?.workNeeded ?? null,
    conversationSummary: extracted?.conversationSummary ?? input.bodyText ?? null,
  };
}

async function createDraft(input: CaptureInput) {
  const photoUrls = await uploadImages(input.images);
  const extracted = await extractFields(input, visionUrls(photoUrls, input.images));
  const title = draftJobTitle({
    bikeYearMakeModel: extracted.bikeYearMakeModel,
    customerName: extracted.customerName,
    subject: input.subject ?? null,
  });
  const description = draftJobDescription({
    workNeeded: extracted.workNeeded,
    conversationSummary: extracted.conversationSummary,
    bodyText: input.bodyText ?? null,
  });

  const [job] = await db
    .insert(jobs)
    .values({ title, description, status: "open_draft" })
    .returning();

  try {
    const [draft] = await db
      .insert(intakeDrafts)
      .values({
        jobId: job.id,
        resendEmailId: input.resendEmailId ?? null,
        telegramMediaGroupId: input.telegramMediaGroupId ?? null,
        source: input.source,
        fromEmail: input.fromEmail ?? null,
        subject: input.subject ?? null,
        bodyText: input.bodyText ?? null,
        photoUrls,
        customerName: extracted.customerName,
        customerPhone: extracted.phone,
        customerEmail: extracted.email,
        bikeYearMakeModel: extracted.bikeYearMakeModel,
        workNeeded: extracted.workNeeded,
        conversationSummary: extracted.conversationSummary,
        extracted,
        status: "pending_review",
      })
      .returning();

    await sendOwnerIntakeDraftEmail({ job, draft }).catch((error) => {
      console.error("[intake] owner draft email failed:", error);
    });

    return { job, draft, appended: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (input.telegramMediaGroupId && /unique|duplicate/i.test(message)) {
      const raced = await db.query.intakeDrafts.findFirst({
        where: eq(intakeDrafts.telegramMediaGroupId, input.telegramMediaGroupId),
        with: { job: true },
      });
      if (raced?.job) {
        await db.delete(jobs).where(eq(jobs.id, job.id));
        return appendToDraft(raced.job, raced, input);
      }
    }
    throw error;
  }
}

async function appendToDraft(job: JobRow, draft: IntakeDraftRow, input: CaptureInput) {
  const newUrls = await uploadImages(input.images);
  const photoUrls = [...draft.photoUrls, ...newUrls];
  const bodyText = [draft.bodyText, input.bodyText].filter(Boolean).join("\n");
  const extracted = await extractFields(
    { ...input, bodyText, fallbackName: draft.customerName ?? input.fallbackName },
    photoUrls,
  );

  const title = draftJobTitle({
    bikeYearMakeModel: extracted.bikeYearMakeModel ?? draft.bikeYearMakeModel,
    customerName: extracted.customerName ?? draft.customerName,
    subject: draft.subject ?? input.subject ?? null,
  });
  const description = draftJobDescription({
    workNeeded: extracted.workNeeded ?? draft.workNeeded,
    conversationSummary: extracted.conversationSummary ?? draft.conversationSummary,
    bodyText,
  });

  const [updatedJob] = await db
    .update(jobs)
    .set({ title, description, updatedAt: new Date() })
    .where(eq(jobs.id, job.id))
    .returning();

  const [updatedDraft] = await db
    .update(intakeDrafts)
    .set({
      bodyText,
      photoUrls,
      customerName: extracted.customerName ?? draft.customerName,
      customerPhone: extracted.phone ?? draft.customerPhone,
      customerEmail: extracted.email ?? draft.customerEmail,
      bikeYearMakeModel: extracted.bikeYearMakeModel ?? draft.bikeYearMakeModel,
      workNeeded: extracted.workNeeded ?? draft.workNeeded,
      conversationSummary: extracted.conversationSummary ?? draft.conversationSummary,
      extracted,
      updatedAt: new Date(),
    })
    .where(eq(intakeDrafts.id, draft.id))
    .returning();

  return { job: updatedJob, draft: updatedDraft, appended: true };
}
