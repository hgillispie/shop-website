"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { jobs, jobStatusEnum, tickets } from "@/lib/db/schema";
import {
  IntakePromoteError,
  promoteIntakeDraft,
  type LiveJobStatus,
} from "@/lib/intake/promote";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
  return session;
}

function revalidateJobPaths() {
  revalidatePath("/admin/board");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/crm");
}

export async function deleteJob(jobId: string) {
  await requireSession();
  await db.update(tickets).set({ jobId: null }).where(eq(tickets.jobId, jobId));
  await db.delete(jobs).where(eq(jobs.id, jobId));
  revalidateJobPaths();
}

export async function updateJobStatus(
  jobId: string,
  status: (typeof jobStatusEnum.enumValues)[number],
) {
  await requireSession();

  if (status === "open_draft") {
    throw new Error("Jobs can't be moved back into Open Drafts.");
  }

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!job) throw new Error("Job not found.");

  if (job.status === "open_draft") {
    await promoteIntakeDraft(jobId, status as LiveJobStatus);
  } else {
    await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));
  }

  revalidateJobPaths();
}

export async function approveIntakeDraft(formData: FormData) {
  await requireSession();
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) throw new Error("Missing job.");

  try {
    await promoteIntakeDraft(jobId, "backlog", {
      customerName: String(formData.get("customerName") ?? ""),
      customerPhone: String(formData.get("customerPhone") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      bikeYearMakeModel: String(formData.get("bikeYearMakeModel") ?? ""),
      workNeeded: String(formData.get("workNeeded") ?? ""),
      conversationSummary: String(formData.get("conversationSummary") ?? ""),
    });
  } catch (error) {
    if (error instanceof IntakePromoteError) throw error;
    throw error;
  }

  revalidateJobPaths();
  revalidatePath(`/admin/board/${jobId}`);
}
