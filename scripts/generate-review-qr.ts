import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_REVIEW_URL } from "../lib/google-review.ts";
import { buildReviewQrPng, buildReviewQrSvg } from "../lib/google-review-qr.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "public", "qr");

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "review.svg"), buildReviewQrSvg(CANONICAL_REVIEW_URL));
writeFileSync(join(dir, "review.png"), buildReviewQrPng(CANONICAL_REVIEW_URL));

console.log(`Wrote public/qr/review.svg and public/qr/review.png for ${CANONICAL_REVIEW_URL}`);
