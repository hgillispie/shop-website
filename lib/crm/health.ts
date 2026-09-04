export const HEALTH_BASE = 50;
export const ASK_MIN_HEALTH_WITH_QUOTE = 65;
export const ASK_MIN_HEALTH_WITHOUT_QUOTE = 80;
export const ASK_WITHOUT_QUOTE_MAX_AGE_DAYS = 45;

export type ReviewOutreach = "not_asked" | "asked" | "reviewed" | "skip";
export type QuoteSentiment = "positive" | "neutral" | "negative";

export type HealthJob = { status: string; updatedAt: Date };
export type HealthTicket = { status: string };
export type HealthQuote = { quote?: string; sentiment: QuoteSentiment; approvedForSite?: boolean };

export type HealthInput = {
  jobs: HealthJob[];
  tickets: HealthTicket[];
  quotes: HealthQuote[];
  intakeSentiment: number | null;
  now?: Date;
};

export type HealthResult = {
  score: number;
  reasons: string[];
};

export type ReviewRankInput = {
  healthScore: number;
  reviewOutreach: ReviewOutreach;
  completedJobs: number;
  lastCompletedAt: Date | null;
  positiveQuoteCount: number;
  bestQuote: string | null;
  hasEmail: boolean;
  hasPhone: boolean;
  waitingOnCustomer: boolean;
  now?: Date;
};

export type ReviewRankResult = {
  eligible: boolean;
  rank: number;
  why: string[];
};

const DAY = 24 * 60 * 60 * 1000;

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function lastCompletedJobAt(jobs: HealthJob[]): Date | null {
  const completed = jobs
    .filter((job) => job.status === "complete")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return completed[0]?.updatedAt ?? null;
}

export function computeHealthScore(input: HealthInput): HealthResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  let score = HEALTH_BASE;

  const completed = input.jobs.filter((job) => job.status === "complete");
  const completeBoost = Math.min(completed.length * 8, 24);
  if (completeBoost > 0) {
    score += completeBoost;
    reasons.push(
      completed.length === 1 ? "1 completed job" : `${completed.length} completed jobs`,
    );
  }

  const lastComplete = lastCompletedJobAt(input.jobs);
  if (lastComplete) {
    const age = daysBetween(lastComplete, now);
    if (age <= 14) {
      score += 12;
      reasons.push("Work finished in the last 2 weeks");
    } else if (age <= 45) {
      score += 6;
      reasons.push("Work finished in the last 6 weeks");
    } else if (age <= 90) {
      score += 2;
      reasons.push("Work finished in the last 3 months");
    }
  }

  if (input.jobs.some((job) => job.status === "waiting_on_customer")) {
    score -= 8;
    reasons.push("A job is waiting on the customer");
  }

  const waitingTickets = input.tickets.filter((ticket) => ticket.status === "waiting_on_customer");
  const ticketPenalty = Math.min(waitingTickets.length * 8, 16);
  if (ticketPenalty > 0) {
    score -= ticketPenalty;
    reasons.push(
      waitingTickets.length === 1
        ? "A ticket is waiting on the customer"
        : `${waitingTickets.length} tickets waiting on the customer`,
    );
  }

  if (input.intakeSentiment != null) {
    const delta = Math.round((input.intakeSentiment - HEALTH_BASE) * 0.4);
    score += delta;
    if (delta > 0) reasons.push(`Conversation sentiment ${input.intakeSentiment}`);
    else if (delta < 0) reasons.push(`Conversation sentiment ${input.intakeSentiment}`);
  }

  const positiveQuotes = input.quotes.filter((quote) => quote.sentiment === "positive");
  const negativeQuotes = input.quotes.filter((quote) => quote.sentiment === "negative");
  const positiveBoost = Math.min(positiveQuotes.length * 7, 21);
  const negativePenalty = Math.min(negativeQuotes.length * 12, 24);
  if (positiveBoost > 0) {
    score += positiveBoost;
    reasons.push(
      positiveQuotes.length === 1
        ? "Customer left a compliment"
        : `${positiveQuotes.length} compliments on file`,
    );
  }
  if (negativePenalty > 0) {
    score -= negativePenalty;
    reasons.push(
      negativeQuotes.length === 1
        ? "Customer left a complaint"
        : `${negativeQuotes.length} complaints on file`,
    );
  }

  return { score: clampScore(score), reasons };
}

export function rankReviewOutreach(input: ReviewRankInput): ReviewRankResult {
  const now = input.now ?? new Date();
  const why: string[] = [];

  if (input.reviewOutreach !== "not_asked") {
    return { eligible: false, rank: 0, why: [] };
  }
  if (!input.hasPhone && !input.hasEmail) {
    return { eligible: false, rank: 0, why: [] };
  }
  if (input.completedJobs < 1 || !input.lastCompletedAt) {
    return { eligible: false, rank: 0, why: [] };
  }
  if (input.waitingOnCustomer) {
    return { eligible: false, rank: 0, why: [] };
  }

  const hasQuote = input.positiveQuoteCount > 0;
  const minHealth = hasQuote ? ASK_MIN_HEALTH_WITH_QUOTE : ASK_MIN_HEALTH_WITHOUT_QUOTE;
  if (input.healthScore < minHealth) {
    return { eligible: false, rank: 0, why: [] };
  }

  const age = daysBetween(input.lastCompletedAt, now);
  if (!hasQuote && age > ASK_WITHOUT_QUOTE_MAX_AGE_DAYS) {
    return { eligible: false, rank: 0, why: [] };
  }

  let rank = input.healthScore;
  why.push(`Health ${input.healthScore}`);

  if (hasQuote) {
    const quoteBoost = Math.min(input.positiveQuoteCount * 12, 36);
    rank += quoteBoost;
    if (input.bestQuote) why.push(`They already said: “${truncateQuote(input.bestQuote)}”`);
    else why.push("Has an unused compliment");
  }

  if (age <= 14) {
    rank += 20;
    why.push("Job completed in the last 2 weeks");
  } else if (age <= 45) {
    rank += 10;
    why.push("Job completed in the last 6 weeks");
  } else if (age <= 90) {
    rank += 4;
    why.push("Job completed in the last 3 months");
  }

  if (input.hasEmail) rank += 4;
  if (input.completedJobs > 1) {
    rank += Math.min(input.completedJobs - 1, 3) * 3;
    why.push(`${input.completedJobs} completed jobs`);
  }

  return { eligible: true, rank, why };
}

export function truncateQuote(quote: string, max = 90): string {
  const trimmed = quote.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function positiveQuotes(quotes: HealthQuote[]): HealthQuote[] {
  return quotes.filter((quote) => quote.sentiment === "positive");
}

export function bestPositiveQuote(quotes: HealthQuote[]): string | null {
  const sorted = positiveQuotes(quotes)
    .slice()
    .sort((a, b) => {
      const aFlag = a.approvedForSite ? 1 : 0;
      const bFlag = b.approvedForSite ? 1 : 0;
      if (aFlag !== bFlag) return aFlag - bFlag;
      return (b.quote?.length ?? 0) - (a.quote?.length ?? 0);
    });
  return sorted[0]?.quote?.trim() || null;
}

export function averageIntakeSentiment(scores: Array<number | null | undefined>): number | null {
  const values = scores.filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
}
