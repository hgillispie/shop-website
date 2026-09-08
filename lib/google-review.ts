/** Public short path. Printed QR encodes this URL, not the Google destination. */
export const REVIEW_PATH = "/review";

/** Live shop host — same rule as the vCard QR: never a preview or localhost. */
export const CANONICAL_REVIEW_URL = `https://swaffordspeed.com${REVIEW_PATH}`;

/**
 * Official Google leave-a-review link. Do not append query params that
 * pre-fill stars or review text.
 */
export const GOOGLE_LEAVE_REVIEW_URL =
  "https://g.page/r/CWHtiZtRjnuhEAI/review";

/** Downloadable print assets after deploy. */
export const REVIEW_QR_PNG_PATH = "/qr/review.png";
export const REVIEW_QR_SVG_PATH = "/qr/review.svg";

/**
 * Permanent Next.js redirect (`308`, the 301 equivalent that preserves
 * the request method). Change `destination` here to retarget printed QRs.
 */
export const REVIEW_REDIRECT = {
  source: REVIEW_PATH,
  destination: GOOGLE_LEAVE_REVIEW_URL,
  permanent: true,
} as const;
