"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs, jobStatusEnum, tickets } from "@/lib/db/schema";

export async function deleteJob(jobId: string) {
  await db.update(tickets).set({ jobId: null }).where(eq(tickets.jobId, jobId));
  await db.delete(jobs).where(eq(jobs.id, jobId));
  revalidatePath("/admin/board");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/crm");
}

export async function updateJobStatus(
  jobId: string,
  status: (typeof jobStatusEnum.enumValues)[number],
) {
  await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));
  revalidatePath("/admin/board");
  revalidatePath("/admin/calendar");
}

export async function createJob(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dropoffAtRaw = String(formData.get("dropoffAt") ?? "");

  if (!title) return;

  await db.insert(jobs).values({
    title,
    description,
    dropoffAt: dropoffAtRaw ? new Date(dropoffAtRaw) : null,
    status: "backlog",
  });

  revalidatePath("/admin/board");
  revalidatePath("/admin/calendar");
}
