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
  REVIEW_REDIRECT,
} from "./google-review.ts";
import { CANONICAL_SITE_URL } from "./vcard.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("short link points at the live host and the official Google review URL", () => {
  assert.equal(REVIEW_PATH, "/review");
  assert.equal(CANONICAL_REVIEW_URL, "https://swaffordspeed.com/review");
  assert.equal(CANONICAL_REVIEW_URL, `${CANONICAL_SITE_URL}${REVIEW_PATH}`);
  assert.equal(
    GOOGLE_LEAVE_REVIEW_URL,
    "https://g.page/r/CWHtiZtRjnuhEAI/review",
  );
  assert.equal(GOOGLE_LEAVE_REVIEW_URL.includes("?"), false);
});

test("next.config permanently redirects /review to Google", () => {
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
