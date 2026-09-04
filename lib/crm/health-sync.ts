import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customerQuotes, customers, jobs, tickets } from "@/lib/db/schema";
import { averageIntakeSentiment, computeHealthScore } from "@/lib/crm/health";

export async function refreshCustomerHealth(customerId: string) {
  const customerJobs = await db.query.jobs.findMany({
    where: eq(jobs.customerId, customerId),
    with: { intakeDraft: true },
  });
  const customerTickets = await db.query.tickets.findMany({
    where: eq(tickets.customerId, customerId),
  });
  const quotes = await db.query.customerQuotes.findMany({
    where: eq(customerQuotes.customerId, customerId),
  });

  const intakeSentiment = averageIntakeSentiment(
    customerJobs.map((job) => job.intakeDraft?.extracted?.sentimentScore),
  );
  const { score } = computeHealthScore({
    jobs: customerJobs,
    tickets: customerTickets,
    quotes,
    intakeSentiment,
  });

  await db
    .update(customers)
    .set({
      healthScore: score,
      healthScoredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));

  return score;
}
