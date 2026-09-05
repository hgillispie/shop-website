import assert from "node:assert/strict";
import test from "node:test";
import {
  buildShopVcard,
  CANONICAL_SITE_URL,
  CANONICAL_VCARD_URL,
  shopContact,
  shopContactAddressLine,
  VCARD_HEADERS,
  VCARD_PATH,
} from "./vcard.ts";
import { siteConfig } from "../data/site-config.ts";

test("vCard is version 3.0 with CRLF and a trailing newline", () => {
  const body = buildShopVcard();
  assert.ok(body.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.ok(body.endsWith("END:VCARD\r\n"));
  assert.ok(body.includes("\r\n"));
  assert.equal(body.includes("\n") && !body.includes("\r\n") ? "lf" : "crlf", "crlf");
});

test("vCard carries the confirmed person, shop, and address fields", () => {
  const lines = new Set(buildShopVcard().trimEnd().split("\r\n"));
  assert.ok(lines.has("FN:Matt Daves"));
  assert.ok(lines.has("N:Daves;Matt;;;"));
  assert.ok(lines.has(`ORG:${siteConfig.shopName}`));
  assert.ok(lines.has(`TEL;TYPE=WORK,VOICE:${siteConfig.phoneHref.replace(/^tel:/, "")}`));
  assert.ok(lines.has(`URL:${CANONICAL_SITE_URL}`));
  assert.ok(lines.has("ADR;TYPE=WORK:;;529 E Darby Road;Taylors;SC;29687;US"));
  assert.ok(
    lines.has("NOTE:Harley-Davidson performance & custom shop\\, Upstate SC"),
  );
  assert.ok(lines.has(`EMAIL;TYPE=WORK:${siteConfig.email}`));
});

test("street and ZIP match the real address already in site config", () => {
  assert.equal(siteConfig.address, "529 E Darby Road, Taylors, SC 29687");
  assert.equal(shopContact.street, "529 E Darby Road");
  assert.equal(shopContact.postalCode, "29687");
  assert.equal(shopContactAddressLine, siteConfig.address);
  assert.match(buildShopVcard(), /529 E Darby Road/);
  assert.match(buildShopVcard(), /29687/);
});

test("QR / NFC target is the hosted .vcf URL, not an embedded vCard payload", () => {
  assert.equal(VCARD_PATH, "/c.vcf");
  assert.equal(CANONICAL_VCARD_URL, "https://swaffordspeed.com/c.vcf");
  assert.ok(!CANONICAL_VCARD_URL.includes("BEGIN:VCARD"));
  assert.equal(VCARD_HEADERS["Content-Type"], "text/vcard; charset=utf-8");
  assert.match(VCARD_HEADERS["Content-Disposition"], /^inline;/);
});
