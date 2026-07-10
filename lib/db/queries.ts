import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { appointmentRequests, jobs } from "@/lib/db/schema";

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
