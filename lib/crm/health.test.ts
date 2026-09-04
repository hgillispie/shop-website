import assert from "node:assert/strict";
import test from "node:test";
import {
  ASK_MIN_HEALTH_WITH_QUOTE,
  ASK_MIN_HEALTH_WITHOUT_QUOTE,
  computeHealthScore,
  rankReviewOutreach,
} from "./health.ts";

const now = new Date("2026-09-04T12:00:00Z");

function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

test("happy completed customer with a compliment scores high", () => {
  const health = computeHealthScore({
    now,
    jobs: [{ status: "complete", updatedAt: daysAgo(3) }],
    tickets: [{ status: "resolved" }],
    quotes: [{ sentiment: "positive", quote: "You guys crushed the wiring on my Softail" }],
    intakeSentiment: 90,
  });
  assert.ok(health.score >= 80, `expected high score, got ${health.score}`);
  assert.ok(health.reasons.some((reason) => /compliment/i.test(reason)));
});

test("open work tickets do not drag down health", () => {
  const withOpen = computeHealthScore({
    now,
    jobs: [{ status: "in_progress", updatedAt: daysAgo(1) }],
    tickets: [{ status: "open" }, { status: "in_progress" }],
    quotes: [],
    intakeSentiment: null,
  });
  assert.equal(withOpen.score, 50);
});

test("waiting-on-customer and complaints lower the score", () => {
  const health = computeHealthScore({
    now,
    jobs: [
      { status: "complete", updatedAt: daysAgo(10) },
      { status: "waiting_on_customer", updatedAt: daysAgo(1) },
    ],
    tickets: [{ status: "waiting_on_customer" }],
    quotes: [{ sentiment: "negative", quote: "This is taking way too long and I'm frustrated" }],
    intakeSentiment: 30,
  });
  assert.ok(health.score < 50, `expected low score, got ${health.score}`);
});

test("ask-first list ranks a glowing recent customer first", () => {
  const glowing = rankReviewOutreach({
    now,
    healthScore: 92,
    reviewOutreach: "not_asked",
    completedJobs: 1,
    lastCompletedAt: daysAgo(2),
    positiveQuoteCount: 1,
    bestQuote: "Y'all are the only shop I trust with this bike",
    hasEmail: true,
    hasPhone: true,
    waitingOnCustomer: false,
  });
  const operationalOnly = rankReviewOutreach({
    now,
    healthScore: 84,
    reviewOutreach: "not_asked",
    completedJobs: 2,
    lastCompletedAt: daysAgo(10),
    positiveQuoteCount: 0,
    bestQuote: null,
    hasEmail: false,
    hasPhone: true,
    waitingOnCustomer: false,
  });

  assert.equal(glowing.eligible, true);
  assert.equal(operationalOnly.eligible, true);
  assert.ok(glowing.rank > operationalOnly.rank);
  assert.ok(glowing.why.some((line) => /already said/i.test(line)));
});

test("do not ask until work is complete, even with a compliment", () => {
  const ranked = rankReviewOutreach({
    now,
    healthScore: 90,
    reviewOutreach: "not_asked",
    completedJobs: 0,
    lastCompletedAt: null,
    positiveQuoteCount: 2,
    bestQuote: "Love this shop",
    hasEmail: true,
    hasPhone: true,
    waitingOnCustomer: false,
  });
  assert.equal(ranked.eligible, false);
});

test("already asked, reviewed, or skipped customers drop off the list", () => {
  for (const reviewOutreach of ["asked", "reviewed", "skip"] as const) {
    const ranked = rankReviewOutreach({
      now,
      healthScore: 95,
      reviewOutreach,
      completedJobs: 3,
      lastCompletedAt: daysAgo(1),
      positiveQuoteCount: 1,
      bestQuote: "Amazing work",
      hasEmail: true,
      hasPhone: true,
      waitingOnCustomer: false,
    });
    assert.equal(ranked.eligible, false, reviewOutreach);
  }
});

test("without a quote, only recent high-health completes are asked", () => {
  const recentHigh = rankReviewOutreach({
    now,
    healthScore: ASK_MIN_HEALTH_WITHOUT_QUOTE,
    reviewOutreach: "not_asked",
    completedJobs: 1,
    lastCompletedAt: daysAgo(7),
    positiveQuoteCount: 0,
    bestQuote: null,
    hasEmail: false,
    hasPhone: true,
    waitingOnCustomer: false,
  });
  const staleHigh = rankReviewOutreach({
    now,
    healthScore: 90,
    reviewOutreach: "not_asked",
    completedJobs: 1,
    lastCompletedAt: daysAgo(60),
    positiveQuoteCount: 0,
    bestQuote: null,
    hasEmail: false,
    hasPhone: true,
    waitingOnCustomer: false,
  });
  const midHealth = rankReviewOutreach({
    now,
    healthScore: ASK_MIN_HEALTH_WITH_QUOTE,
    reviewOutreach: "not_asked",
    completedJobs: 1,
    lastCompletedAt: daysAgo(3),
    positiveQuoteCount: 0,
    bestQuote: null,
    hasEmail: false,
    hasPhone: true,
    waitingOnCustomer: false,
  });

  assert.equal(recentHigh.eligible, true);
  assert.equal(staleHigh.eligible, false);
  assert.equal(midHealth.eligible, false);
});

test("waiting on the customer is never first to ask", () => {
  const ranked = rankReviewOutreach({
    now,
    healthScore: 95,
    reviewOutreach: "not_asked",
    completedJobs: 1,
    lastCompletedAt: daysAgo(1),
    positiveQuoteCount: 1,
    bestQuote: "Best shop in town and I mean that",
    hasEmail: true,
    hasPhone: true,
    waitingOnCustomer: true,
  });
  assert.equal(ranked.eligible, false);
});
