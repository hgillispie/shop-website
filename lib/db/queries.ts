import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { averageIntakeSentiment } from "@/lib/crm/health";
import { buildCustomerHealthView, rankAskFirstQueue } from "@/lib/crm/dashboard";
import {
  appointmentRequests,
  customerQuotes,
  customers,
  ipRules,
  jobs,
  pageViews,
  serviceInvoiceJobs,
  serviceInvoices,
  tickets,
} from "@/lib/db/schema";

export function getRequests() {
  return db.query.appointmentRequests.findMany({
    orderBy: [desc(appointmentRequests.createdAt)],
  });
}

export function getRequestById(id: string) {
  return db.query.appointmentRequests.findFirst({
    where: eq(appointmentRequests.id, id),
  });
}

export function getJobForRequest(requestId: string) {
  return db.query.jobs.findFirst({
    where: eq(jobs.requestId, requestId),
  });
}

// Board detail page + invoice prefill (see app/admin/(dashboard)/board/[id]
// and the ?fromJobId= handling in app/admin/(dashboard)/invoices/new) both
// need the full picture — the job, its linked customer, and its linked
// intake request (bike info, service types, the customer's own words,
// photos) — in one query rather than three separate lookups.
export function getJobById(id: string) {
  return db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    // request.customer is a fallback for jobs created before customerId
    // was set directly on the job itself (see approveRequest in
    // app/admin/(dashboard)/requests/actions.ts) — resolve either way
    // rather than assuming every job has the direct link.
    with: {
      request: { with: { customer: true } },
      customer: true,
      intakeDraft: true,
    },
  });
}

export function getJobs() {
  return db.query.jobs.findMany({
    orderBy: [desc(jobs.createdAt)],
    with: { request: true, intakeDraft: true },
  });
}

export function getCustomers() {
  return db.query.customers.findMany({
    orderBy: [desc(customers.createdAt)],
  });
}

export function getCustomerById(id: string) {
  return db.query.customers.findFirst({
    where: eq(customers.id, id),
  });
}

export function getRequestsForCustomer(customerId: string) {
  return db.query.appointmentRequests.findMany({
    where: eq(appointmentRequests.customerId, customerId),
    orderBy: [desc(appointmentRequests.createdAt)],
  });
}

export function getJobsForCustomer(customerId: string) {
  return db.query.jobs.findMany({
    where: eq(jobs.customerId, customerId),
    orderBy: [desc(jobs.createdAt)],
  });
}

export function getTicketsForCustomer(customerId: string) {
  return db.query.tickets.findMany({
    where: eq(tickets.customerId, customerId),
    orderBy: [desc(tickets.createdAt)],
  });
}

export function getAllTickets() {
  return db.query.tickets.findMany({
    orderBy: [desc(tickets.createdAt)],
    with: { customer: true },
  });
}

export function getQuotesForCustomer(customerId: string) {
  return db.query.customerQuotes.findMany({
    where: eq(customerQuotes.customerId, customerId),
    orderBy: [desc(customerQuotes.createdAt)],
  });
}

export function getAllCustomerQuotes() {
  return db.query.customerQuotes.findMany({
    orderBy: [desc(customerQuotes.createdAt)],
  });
}

function groupByCustomerId<T extends { customerId: string | null }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    if (!row.customerId) continue;
    const list = grouped.get(row.customerId) ?? [];
    list.push(row);
    grouped.set(row.customerId, list);
  }
  return grouped;
}

export async function getCrmHealthViews() {
  const [customerRows, jobRows, ticketRows, quoteRows] = await Promise.all([
    getCustomers(),
    db.query.jobs.findMany({ with: { intakeDraft: true } }),
    db.query.tickets.findMany(),
    getAllCustomerQuotes(),
  ]);

  const jobsByCustomer = groupByCustomerId(jobRows);
  const ticketsByCustomer = groupByCustomerId(ticketRows);
  const quotesByCustomer = groupByCustomerId(quoteRows);

  const views = customerRows.map((customer) => {
    const customerJobs = jobsByCustomer.get(customer.id) ?? [];
    return buildCustomerHealthView({
      customer,
      jobs: customerJobs,
      tickets: ticketsByCustomer.get(customer.id) ?? [],
      quotes: quotesByCustomer.get(customer.id) ?? [],
      intakeSentiment: averageIntakeSentiment(
        customerJobs.map((job) => job.intakeDraft?.extracted?.sentimentScore),
      ),
    });
  });

  return { views, askFirst: rankAskFirstQueue(views) };
}

export async function getCustomerHealthView(customerId: string) {
  const customer = await getCustomerById(customerId);
  if (!customer) return null;

  const [customerJobs, customerTickets, quotes] = await Promise.all([
    db.query.jobs.findMany({
      where: eq(jobs.customerId, customerId),
      with: { intakeDraft: true },
    }),
    getTicketsForCustomer(customerId),
    getQuotesForCustomer(customerId),
  ]);

  return buildCustomerHealthView({
    customer,
    jobs: customerJobs,
    tickets: customerTickets,
    quotes,
    intakeSentiment: averageIntakeSentiment(
      customerJobs.map((job) => job.intakeDraft?.extracted?.sentimentScore),
    ),
  });
}

export function getRecentPageViews(limit = 500) {
  return db.query.pageViews.findMany({
    orderBy: [desc(pageViews.createdAt)],
    limit,
  });
}

export function getIpRules() {
  return db.query.ipRules.findMany({
    orderBy: [desc(ipRules.createdAt)],
  });
}

// getStoreOrders/getStoreOrderById/getStoreOrderByStripePaymentIntentId/
// getStoreOrderByPrintifyOrderId were removed here as part of the Shopify
// migration (see docs/shopify-migration-plan.md) — no local order model to
// query anymore; merch orders live in Shopify's admin, and a paid repair
// invoice will be looked up by whatever Shopify sends on the orders/paid
// webhook once Task 2 is built (see serviceInvoices below for the invoice
// side of that).

export function getServiceInvoices() {
  return db.query.serviceInvoices.findMany({
    orderBy: [desc(serviceInvoices.createdAt)],
  });
}

export function getServiceInvoiceById(id: string) {
  return db.query.serviceInvoices.findFirst({
    where: eq(serviceInvoices.id, id),
    with: {
      jobs: {
        orderBy: [serviceInvoiceJobs.position],
        with: {
          parts: {
            orderBy: (parts, { asc }) => [asc(parts.position)],
          },
        },
      },
    },
  });
}

// Shared shape for anything that needs a full invoice + its nested
// jobs/parts (PDF rendering, emailing) — one source of truth instead of
// each consumer hand-rolling the same intersection type.
export type ServiceInvoiceWithJobs = NonNullable<
  Awaited<ReturnType<typeof getServiceInvoiceById>>
>;
