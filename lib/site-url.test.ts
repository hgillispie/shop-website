import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  APEX_SITE_URL,
  GOOGLE_REVIEW_URL,
  canonicalUrl,
  siteOrigin,
} from "./site-url.ts";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("siteOrigin", () => {
  it("maps www and trailing slashes to the apex shop host", () => {
    assert.equal(siteOrigin("https://www.swaffordspeed.com"), APEX_SITE_URL);
    assert.equal(siteOrigin("https://www.swaffordspeed.com/"), APEX_SITE_URL);
    assert.equal(siteOrigin("https://swaffordspeed.com/"), APEX_SITE_URL);
    assert.equal(siteOrigin("https://swaffordspeed.com"), APEX_SITE_URL);
  });

  it("leaves localhost and preview hosts alone", () => {
    assert.equal(siteOrigin("http://localhost:3000"), "http://localhost:3000");
    assert.equal(
      siteOrigin("https://shop-website-git-preview.vercel.app"),
      "https://shop-website-git-preview.vercel.app",
    );
  });
});

describe("canonicalUrl", () => {
  it("uses the origin with no trailing slash for home", () => {
    assert.equal(canonicalUrl("/", APEX_SITE_URL), APEX_SITE_URL);
    assert.equal(
      canonicalUrl("/", "https://www.swaffordspeed.com/"),
      APEX_SITE_URL,
    );
  });

  it("joins paths without a trailing slash", () => {
    assert.equal(
      canonicalUrl("/about", APEX_SITE_URL),
      `${APEX_SITE_URL}/about`,
    );
    assert.equal(
      canonicalUrl("/privacy/", "https://www.swaffordspeed.com"),
      `${APEX_SITE_URL}/privacy`,
    );
    assert.equal(
      canonicalUrl("/store/products/evo-pocket-tee", APEX_SITE_URL),
      `${APEX_SITE_URL}/store/products/evo-pocket-tee`,
    );
  });
});

describe("review redirect stays off the sitemap", () => {
  const sitemap = readRepoFile("app/sitemap.ts");
  const nextConfig = readRepoFile("next.config.ts");

  it("does not list /review in sitemap.ts", () => {
    assert.doesNotMatch(sitemap, /\/review/);
    assert.doesNotMatch(sitemap, /g\.page/);
  });

  it("permanently redirects /review to the Google review URL", () => {
    assert.match(nextConfig, /source:\s*["']\/review["']/);
    assert.match(nextConfig, /permanent:\s*true/);
    assert.ok(nextConfig.includes(GOOGLE_REVIEW_URL));
  });
});

describe("public pages set self-canonicals", () => {
  const pages = [
    "app/page.tsx",
    "app/about/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/store/page.tsx",
    "app/store/cart/page.tsx",
    "app/store/products/[handle]/page.tsx",
  ];

  for (const file of pages) {
    it(`${file} calls canonicalUrl`, () => {
      const source = readRepoFile(file);
      assert.match(source, /canonicalUrl\(/);
      assert.match(source, /alternates:\s*\{\s*canonical:/);
    });
  }

  it("root layout does not set a homepage canonical or og:url", () => {
    const source = readRepoFile("app/layout.tsx");
    assert.doesNotMatch(source, /alternates:/);
    assert.doesNotMatch(source, /openGraph:[\s\S]*url:/);
  });
});
