import {
  bestPositiveQuote,
  computeHealthScore,
  lastCompletedJobAt,
  rankReviewOutreach,
  positiveQuotes,
  type HealthResult,
  type ReviewOutreach,
  type ReviewRankResult,
} from "@/lib/crm/health";
import type { CustomerQuoteRow, CustomerRow, JobRow, TicketRow } from "@/lib/db/schema";

export type CustomerHealthView = {
  customer: CustomerRow;
  jobs: JobRow[];
  tickets: TicketRow[];
  quotes: CustomerQuoteRow[];
  intakeSentiment: number | null;
  health: HealthResult;
  completedJobs: number;
  lastCompletedAt: Date | null;
  waitingOnCustomer: boolean;
  bestQuote: string | null;
  outreach: ReviewRankResult;
};

export function buildCustomerHealthView(input: {
  customer: CustomerRow;
  jobs: JobRow[];
  tickets: TicketRow[];
  quotes: CustomerQuoteRow[];
  intakeSentiment: number | null;
  now?: Date;
}): CustomerHealthView {
  const health = computeHealthScore({
    jobs: input.jobs,
    tickets: input.tickets,
    quotes: input.quotes,
    intakeSentiment: input.intakeSentiment,
    now: input.now,
  });
  const completed = input.jobs.filter((job) => job.status === "complete");
  const lastCompletedAt = lastCompletedJobAt(input.jobs);
  const waitingOnCustomer =
    input.jobs.some((job) => job.status === "waiting_on_customer") ||
    input.tickets.some((ticket) => ticket.status === "waiting_on_customer");
  const bestQuote = bestPositiveQuote(input.quotes);
  const outreach = rankReviewOutreach({
    healthScore: health.score,
    reviewOutreach: input.customer.reviewOutreach as ReviewOutreach,
    completedJobs: completed.length,
    lastCompletedAt,
    positiveQuoteCount: positiveQuotes(input.quotes).length,
    bestQuote,
    hasEmail: Boolean(input.customer.email),
    hasPhone: Boolean(input.customer.phone),
    waitingOnCustomer,
    now: input.now,
  });

  return {
    customer: input.customer,
    jobs: input.jobs,
    tickets: input.tickets,
    quotes: input.quotes,
    intakeSentiment: input.intakeSentiment,
    health,
    completedJobs: completed.length,
    lastCompletedAt,
    waitingOnCustomer,
    bestQuote,
    outreach,
  };
}

export function rankAskFirstQueue(views: CustomerHealthView[]): CustomerHealthView[] {
  return views
    .filter((view) => view.outreach.eligible)
    .sort((a, b) => {
      if (b.outreach.rank !== a.outreach.rank) return b.outreach.rank - a.outreach.rank;
      const aTime = a.lastCompletedAt?.getTime() ?? 0;
      const bTime = b.lastCompletedAt?.getTime() ?? 0;
      return bTime - aTime;
    });
}
