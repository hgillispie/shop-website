import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  appointmentRequests,
  customers,
  ipRules,
  jobs,
  pageViews,
  storeOrders,
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

export function getJobs() {
  return db.query.jobs.findMany({
    orderBy: [desc(jobs.createdAt)],
    with: { request: true },
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

export function getStoreOrders() {
  return db.query.storeOrders.findMany({
    orderBy: [desc(storeOrders.createdAt)],
    with: { items: true },
  });
}

// This is the real `getOrderByRef` the Stripe scaffold left stubbed out —
// always look up by `id` (a UUID), never `orderNumber`. The order-
// confirmation page is unauthenticated by design (guest checkout), so
// whatever key looks up an order there is effectively a bearer token for
// its name/address/items — a sequential integer would be trivially guessable.
export function getStoreOrderById(id: string) {
  return db.query.storeOrders.findFirst({
    where: eq(storeOrders.id, id),
    with: { items: true },
  });
}

export function getStoreOrderByStripePaymentIntentId(paymentIntentId: string) {
  return db.query.storeOrders.findFirst({
    where: eq(storeOrders.stripePaymentIntentId, paymentIntentId),
    with: { items: true },
  });
}

export function getStoreOrderByPrintifyOrderId(printifyOrderId: string) {
  return db.query.storeOrders.findFirst({
    where: eq(storeOrders.printifyOrderId, printifyOrderId),
    with: { items: true },
  });
}
