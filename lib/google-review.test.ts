import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { siteConfig } from "../data/site-config.ts";
import {
  CANONICAL_REVIEW_URL,
  GOOGLE_LEAVE_REVIEW_URL,
  REVIEW_PATH,
  REVIEW_QR_PNG_PATH,
  REVIEW_QR_SVG_PATH,
  REVIEW_REDIRECT,
} from "./google-review.ts";
import {
  REVIEW_QR_ENCODE_OPTIONS,
  REVIEW_QR_PNG_SCALE,
  buildReviewQrPng,
  buildReviewQrSvg,
  encodeReviewQr,
} from "./google-review-qr.ts";
import { CANONICAL_SITE_URL } from "./vcard.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("short link encodes the live host and the official Google review URL", () => {
  assert.equal(REVIEW_PATH, "/review");
  assert.equal(CANONICAL_REVIEW_URL, "https://swaffordspeed.com/review");
  assert.equal(CANONICAL_REVIEW_URL, `${CANONICAL_SITE_URL}${REVIEW_PATH}`);
  assert.equal(
    GOOGLE_LEAVE_REVIEW_URL,
    "https://g.page/r/CWHtiZtRjnuhEAI/review",
  );
  assert.equal(GOOGLE_LEAVE_REVIEW_URL.includes("?"), false);
  assert.equal(REVIEW_QR_PNG_PATH, "/qr/review.png");
  assert.equal(REVIEW_QR_SVG_PATH, "/qr/review.svg");
});

test("next.config permanently redirects /review to Google and leaves other public routes alone", () => {
  assert.equal(REVIEW_REDIRECT.source, REVIEW_PATH);
  assert.equal(REVIEW_REDIRECT.destination, GOOGLE_LEAVE_REVIEW_URL);
  assert.equal(REVIEW_REDIRECT.permanent, true);

  const config = readFileSync(join(root, "next.config.ts"), "utf8");
  assert.match(config, /REVIEW_REDIRECT/);
  assert.match(config, /async redirects\(\)/);
  assert.match(config, /return \[REVIEW_REDIRECT\]/);
});

test("/review stays off nav, footer, sitemap, and is robots-disallowed", () => {
  assert.ok(
    !siteConfig.navLinks.some((link) => link.href.includes(REVIEW_PATH)),
  );

  const footer = readFileSync(
    join(root, "components/layout/Footer.tsx"),
    "utf8",
  );
  const homepage = readFileSync(join(root, "app/page.tsx"), "utf8");
  const sitemap = readFileSync(join(root, "app/sitemap.ts"), "utf8");
  const robots = readFileSync(join(root, "app/robots.ts"), "utf8");
  const mobileBar = readFileSync(
    join(root, "components/layout/MobileActionBar.tsx"),
    "utf8",
  );

  assert.equal(footer.includes(REVIEW_PATH), false);
  assert.equal(homepage.includes(REVIEW_PATH), false);
  assert.equal(sitemap.includes(REVIEW_PATH), false);
  assert.equal(mobileBar.includes(REVIEW_PATH), false);
  assert.match(robots, /disallow: \[[^\]]*\/review/);
});

test("printable QR encodes the short link at ECC H", () => {
  assert.equal(REVIEW_QR_ENCODE_OPTIONS.ecc, "H");
  assert.ok(REVIEW_QR_ENCODE_OPTIONS.border >= 4);

  const svg = buildReviewQrSvg(CANONICAL_REVIEW_URL);
  assert.match(svg, /<svg /);
  assert.match(svg, new RegExp(`Encodes ${CANONICAL_REVIEW_URL}`));
  assert.equal(svg.includes(GOOGLE_LEAVE_REVIEW_URL), false);

  const png = buildReviewQrPng(CANONICAL_REVIEW_URL);
  assert.equal(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), true);

  const { size } = encodeReviewQr(CANONICAL_REVIEW_URL);
  const width = size * REVIEW_QR_PNG_SCALE;
  assert.equal(png.readUInt32BE(16), width);
  assert.equal(png.readUInt32BE(20), width);
});

test("committed public/qr assets match the generator", () => {
  const svgPath = join(root, "public/qr/review.svg");
  const pngPath = join(root, "public/qr/review.png");
  assert.equal(readFileSync(svgPath, "utf8"), buildReviewQrSvg(CANONICAL_REVIEW_URL));
  assert.equal(
    Buffer.compare(readFileSync(pngPath), buildReviewQrPng(CANONICAL_REVIEW_URL)),
    0,
  );
});
