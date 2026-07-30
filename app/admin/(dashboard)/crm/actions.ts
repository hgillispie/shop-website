"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { customers, tickets, ticketStatusEnum } from "@/lib/db/schema";

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) return;

  await db.insert(customers).values({
    name,
    phone,
    email: String(formData.get("email") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    source: "manual",
  });

  revalidatePath("/admin/crm");
}

export async function createTicket(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  if (!customerId || !subject) return;

  await db.insert(tickets).values({
    customerId,
    subject,
    details: String(formData.get("details") ?? "").trim() || null,
    status: "open",
  });

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${customerId}`);
}

export async function updateTicketStatus(formData: FormData) {
  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "") as (typeof ticketStatusEnum.enumValues)[number];
  const customerId = String(formData.get("customerId") ?? "");
  if (!ticketId || !status) return;

  await db.update(tickets).set({ status, updatedAt: new Date() }).where(eq(tickets.id, ticketId));

  revalidatePath("/admin/crm");
  if (customerId) revalidatePath(`/admin/crm/${customerId}`);
}
