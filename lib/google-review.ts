/** Public short path. Anyone with the URL lands on the Google review form. */
export const REVIEW_PATH = "/review";

/** Live shop host — never a preview or localhost. */
export const CANONICAL_REVIEW_URL = `https://swaffordspeed.com${REVIEW_PATH}`;

/**
 * Official Google leave-a-review link. Do not append query params that
 * pre-fill stars or review text.
 */
export const GOOGLE_LEAVE_REVIEW_URL =
  "https://g.page/r/CWHtiZtRjnuhEAI/review";

/**
 * Permanent Next.js redirect (`308`, the 301 equivalent that preserves
 * the request method).
 */
export const REVIEW_REDIRECT = {
  source: REVIEW_PATH,
  destination: GOOGLE_LEAVE_REVIEW_URL,
  permanent: true,
} as const;
