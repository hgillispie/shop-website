"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { addManualQuote } from "@/lib/crm/quotes";
import { refreshCustomerHealth } from "@/lib/crm/health-sync";
import { isUsableQuote } from "@/lib/intake/fields";
import {
  appointmentRequests,
  customerQuotes,
  customers,
  jobs,
  reviewOutreachEnum,
  tickets,
  ticketStatusEnum,
} from "@/lib/db/schema";

function revalidateCustomer(customerId: string) {
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${customerId}`);
}

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

  revalidateCustomer(customerId);
}

export async function deleteCustomer(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) return;

  await db
    .update(appointmentRequests)
    .set({ customerId: null })
    .where(eq(appointmentRequests.customerId, customerId));
  await db.delete(customerQuotes).where(eq(customerQuotes.customerId, customerId));
  await db.delete(tickets).where(eq(tickets.customerId, customerId));
  await db.delete(jobs).where(eq(jobs.customerId, customerId));
  await db.delete(customers).where(eq(customers.id, customerId));

  revalidatePath("/admin/crm");
  revalidatePath("/admin/board");
  revalidatePath("/admin/calendar");
  redirect("/admin/crm");
}

export async function deleteTicket(formData: FormData) {
  const ticketId = String(formData.get("ticketId") ?? "");
  const customerId = String(formData.get("customerId") ?? "");
  if (!ticketId) return;

  await db.delete(tickets).where(eq(tickets.id, ticketId));
  if (customerId) await refreshCustomerHealth(customerId);

  revalidatePath("/admin/crm");
  if (customerId) revalidatePath(`/admin/crm/${customerId}`);
}

export async function updateTicketStatus(formData: FormData) {
  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "") as (typeof ticketStatusEnum.enumValues)[number];
  const customerId = String(formData.get("customerId") ?? "");
  if (!ticketId || !status) return;

  await db.update(tickets).set({ status, updatedAt: new Date() }).where(eq(tickets.id, ticketId));
  if (customerId) await refreshCustomerHealth(customerId);

  revalidatePath("/admin/crm");
  if (customerId) revalidatePath(`/admin/crm/${customerId}`);
}

const OUTREACH = new Set<(typeof reviewOutreachEnum.enumValues)[number]>(
  reviewOutreachEnum.enumValues,
);

export async function updateReviewOutreach(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const next = String(formData.get("reviewOutreach") ?? "");
  if (!customerId || !OUTREACH.has(next as (typeof reviewOutreachEnum.enumValues)[number])) return;

  const reviewOutreach = next as (typeof reviewOutreachEnum.enumValues)[number];
  await db
    .update(customers)
    .set({
      reviewOutreach,
      ...(reviewOutreach === "not_asked"
        ? { reviewAskedAt: null }
        : reviewOutreach === "asked"
          ? { reviewAskedAt: new Date() }
          : {}),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));

  revalidateCustomer(customerId);
}

export async function addCustomerQuote(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const quote = String(formData.get("quote") ?? "").trim();
  const sentimentRaw = String(formData.get("sentiment") ?? "positive");
  const sentiment = sentimentRaw === "negative" ? "negative" : "positive";
  if (!customerId || !isUsableQuote(quote)) return;

  await addManualQuote({ customerId, quote, sentiment });
  await refreshCustomerHealth(customerId);
  revalidateCustomer(customerId);
}

export async function toggleQuoteForSite(formData: FormData) {
  const quoteId = String(formData.get("quoteId") ?? "");
  const customerId = String(formData.get("customerId") ?? "");
  const approvedForSite = String(formData.get("approvedForSite") ?? "") === "true";
  if (!quoteId) return;

  await db
    .update(customerQuotes)
    .set({ approvedForSite: !approvedForSite })
    .where(eq(customerQuotes.id, quoteId));
  if (customerId) await refreshCustomerHealth(customerId);
  if (customerId) revalidateCustomer(customerId);
}

export async function deleteQuote(formData: FormData) {
  const quoteId = String(formData.get("quoteId") ?? "");
  const customerId = String(formData.get("customerId") ?? "");
  if (!quoteId) return;

  await db.delete(customerQuotes).where(eq(customerQuotes.id, quoteId));
  if (customerId) await refreshCustomerHealth(customerId);
  if (customerId) revalidateCustomer(customerId);
}
