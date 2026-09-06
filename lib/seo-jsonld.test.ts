import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  aboutDescription,
  aboutTitle,
  businessJsonLdDescription,
  defaultDescription,
  defaultTitle,
  homeDescription,
} from "../data/seo.ts";
import { capabilities } from "../data/services.ts";

const metadataCopy = [
  defaultTitle,
  defaultDescription,
  homeDescription,
  aboutTitle,
  aboutDescription,
  businessJsonLdDescription,
].join("\n");

describe("SEO metadata", () => {
  it("names chopper, custom, and repair work without a street address", () => {
    assert.match(defaultTitle, /chopper/i);
    assert.match(defaultDescription, /chopper/i);
    assert.match(defaultDescription, /appointment only/i);
    assert.match(aboutTitle, /custom|repair/i);
    assert.match(aboutDescription, /chopper/i);
    assert.match(businessJsonLdDescription, /independent/i);
    assert.match(businessJsonLdDescription, /upstate/i);
    assert.doesNotMatch(metadataCopy, /529 E Darby/i);
    assert.doesNotMatch(metadataCopy, /streetAddress/);
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
