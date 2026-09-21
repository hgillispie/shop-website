import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  aboutDescription,
  aboutTitle,
  businessJsonLdDescription,
  defaultDescription,
  defaultTitle,
  homeDescription,
  homeTitle,
  privacyDescription,
  privacyTitle,
  termsDescription,
  termsTitle,
} from "../data/seo.ts";
import { siteConfig } from "../data/site-config.ts";
import { capabilities } from "../data/services.ts";

const jsonLdSource = readFileSync(new URL("./seo-jsonld.ts", import.meta.url), "utf8");

const metadataCopy = [
  defaultTitle,
  defaultDescription,
  homeTitle,
  homeDescription,
  aboutTitle,
  aboutDescription,
  privacyTitle,
  privacyDescription,
  termsTitle,
  termsDescription,
  businessJsonLdDescription,
].join("\n");

describe("SEO metadata", () => {
  it("leads the home share title with the shop name", () => {
    assert.equal(homeTitle, "Swafford Speed | Upstate Harley Service & Performance");
    assert.equal(defaultTitle, homeTitle);
    assert.doesNotMatch(homeTitle, /chopper/i);
    assert.doesNotMatch(defaultTitle, /chopper/i);
  });

  it("describes home as local Harley performance and repair", () => {
    assert.match(homeDescription, /Harley performance and repair/i);
    assert.match(homeDescription, /Upstate SC/i);
    assert.match(homeDescription, /appointment/i);
    assert.ok(homeDescription.includes(siteConfig.phone));
    assert.equal(defaultDescription, homeDescription);
    assert.doesNotMatch(homeDescription, /chopper/i);
    assert.doesNotMatch(homeDescription, /843/);
    assert.doesNotMatch(defaultDescription, /843/);
  });

  it("keeps chopper and custom language on About and deeper SEO copy", () => {
    assert.match(aboutTitle, /custom|repair/i);
    assert.match(aboutDescription, /chopper/i);
    assert.match(businessJsonLdDescription, /independent/i);
    assert.match(businessJsonLdDescription, /upstate/i);
    assert.doesNotMatch(metadataCopy, /529 E Darby/i);
    assert.doesNotMatch(metadataCopy, /streetAddress/);
  });

  it("gives privacy and terms their own descriptions, not the homepage copy", () => {
    assert.notEqual(privacyDescription, homeDescription);
    assert.notEqual(termsDescription, homeDescription);
    assert.match(privacyDescription, /privacy policy/i);
    assert.match(termsDescription, /appointment-only/i);
    assert.doesNotMatch(privacyDescription, /843/);
    assert.doesNotMatch(termsDescription, /843/);
  });

  it("does not claim dealer status", () => {
    assert.doesNotMatch(defaultDescription, /\bdealer\b/i);
    assert.doesNotMatch(businessJsonLdDescription, /official dealer|authorized dealer/i);
  });

  it("keeps service list names free of chopper keyword stuffing", () => {
    assert.equal(
      capabilities.some((item) => /chopper/i.test(item.title)),
      false,
    );
    assert.deepEqual(
      capabilities.map((item) => item.title),
      [
        "Performance & Power",
        "Suspension & Brakes",
        "Service & Diagnostics",
        "Club-Style & Custom Builds",
        "Engine & Transmission",
        "Wiring, Lighting & Sound",
      ],
    );
  });
});

describe("public locality vs private drop-off", () => {
  it("uses Upstate SC as the public shop city, not Taylors", () => {
    assert.equal(siteConfig.city, "Upstate, SC");
    assert.doesNotMatch(siteConfig.city, /Taylors/i);
  });

  it("keeps the private drop-off address in Taylors", () => {
    assert.equal(siteConfig.address, "529 E Darby Road, Taylors, SC 29687");
  });

  it("omits a street city from public JSON-LD and serves Upstate South Carolina", () => {
    assert.doesNotMatch(jsonLdSource, /addressLocality/);
    assert.doesNotMatch(jsonLdSource, /streetAddress/);
    assert.match(jsonLdSource, /addressRegion: "SC"/);
    assert.match(jsonLdSource, /Upstate South Carolina/);
    assert.match(jsonLdSource, /"Taylors, SC"/);
  });
});
