import "server-only";
import { db } from "@/lib/db/client";
import { customers, tickets, type CustomerRow } from "@/lib/db/schema";

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Small-shop scale (dozens to low hundreds of customers) — an in-memory scan
// is simpler and fast enough than maintaining a normalized-phone index.
export async function findOrCreateCustomer(input: {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  source: string;
}): Promise<CustomerRow> {
  const normalizedPhone = normalizePhone(input.phone);
  const existing = await db.query.customers.findMany();

  const match =
    existing.find((c) => normalizePhone(c.phone) === normalizedPhone) ??
    (input.email
      ? existing.find((c) => c.email?.toLowerCase() === input.email!.toLowerCase())
      : undefined);

  if (match) return match;

  const [created] = await db
    .insert(customers)
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address ?? null,
      source: input.source,
    })
    .returning();

  return created;
}

export async function createTicketForRequest(input: {
  customerId: string;
  subject: string;
  details: string;
  jobId?: string | null;
}) {
  await db.insert(tickets).values({
    customerId: input.customerId,
    jobId: input.jobId ?? null,
    subject: input.subject,
    details: input.details,
    status: "open",
  });
}
