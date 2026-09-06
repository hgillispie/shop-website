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
import { siteConfig } from "../data/site-config.ts";
import { capabilities } from "../data/services.ts";

const publicCopy = [
  defaultTitle,
  defaultDescription,
  homeDescription,
  aboutTitle,
  aboutDescription,
  businessJsonLdDescription,
  siteConfig.tagline,
  ...capabilities.map((item) => `${item.title} ${item.description}`),
].join("\n");

describe("public SEO copy", () => {
  it("targets chopper, custom, and repair search without a street address", () => {
    assert.match(defaultTitle, /chopper/i);
    assert.match(defaultDescription, /chopper/i);
    assert.match(defaultDescription, /appointment only/i);
    assert.match(aboutTitle, /chopper|custom|repair/i);
    assert.match(businessJsonLdDescription, /independent/i);
    assert.match(businessJsonLdDescription, /upstate/i);
    assert.doesNotMatch(publicCopy, /529 E Darby/i);
    assert.doesNotMatch(publicCopy, /streetAddress/);
    assert.ok(
      capabilities.some((item) => /chopper/i.test(`${item.title} ${item.description}`)),
    );
    assert.ok(
      capabilities.some((item) => /repair/i.test(`${item.title} ${item.description}`)),
    );
  });

  it("does not claim dealer status", () => {
    assert.doesNotMatch(defaultDescription, /\bdealer\b/i);
    assert.doesNotMatch(businessJsonLdDescription, /official dealer|authorized dealer/i);
    assert.match(siteConfig.credentials[0].label, /independent shop/i);
  });
});
