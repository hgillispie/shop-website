"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { appointmentRequests, jobs } from "@/lib/db/schema";
import { getRequestById } from "@/lib/db/queries";
import { sendCustomerApprovalEmail, sendCustomerResponseEmail } from "@/lib/email";
import { sendCustomerApprovalSms } from "@/lib/sms";

export async function approveRequest(formData: FormData) {
  const requestId = String(formData.get("requestId"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dropoffAtRaw = String(formData.get("dropoffAt") ?? "");

  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found.");

  const [job] = await db
    .insert(jobs)
    .values({
      requestId,
      title: title || request.bikeYearMakeModel,
      description: description || request.details,
      dropoffAt: dropoffAtRaw ? new Date(dropoffAtRaw) : null,
      status: "backlog",
    })
    .returning();

  await db
    .update(appointmentRequests)
    .set({ status: "approved" })
    .where(eq(appointmentRequests.id, requestId));

  await Promise.allSettled([
    sendCustomerApprovalEmail(request, job),
    sendCustomerApprovalSms(request, job),
  ]);

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/board");
  revalidatePath("/admin/calendar");
}

export async function declineRequest(formData: FormData) {
  const requestId = String(formData.get("requestId"));

  await db
    .update(appointmentRequests)
    .set({ status: "declined" })
    .where(eq(appointmentRequests.id, requestId));

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
}

export async function sendResponse(formData: FormData) {
  const requestId = String(formData.get("requestId"));
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found.");

  await sendCustomerResponseEmail(request, message);

  revalidatePath(`/admin/requests/${requestId}`);
}
