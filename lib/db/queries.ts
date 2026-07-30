import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { appointmentRequests, customers, ipRules, jobs, pageViews, tickets } from "@/lib/db/schema";

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
