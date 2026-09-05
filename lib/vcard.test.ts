import assert from "node:assert/strict";
import test from "node:test";
import {
  buildShopVcard,
  CANONICAL_SITE_URL,
  CANONICAL_VCARD_URL,
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

test("vCard carries the confirmed public shop fields", () => {
  const lines = new Set(buildShopVcard().trimEnd().split("\r\n"));
  assert.ok(lines.has(`ORG:${siteConfig.shopName}`));
  assert.ok(lines.has(`FN:${siteConfig.shopName}`));
  assert.ok(lines.has(`TEL;TYPE=WORK,VOICE:${siteConfig.phoneHref.replace(/^tel:/, "")}`));
  assert.ok(lines.has(`URL:${CANONICAL_SITE_URL}`));
  assert.ok(lines.has("ADR;TYPE=WORK:;;;Taylors;SC;;US"));
  assert.ok(
    lines.has("NOTE:Harley-Davidson performance & custom shop\\, Upstate SC"),
  );
  assert.ok(lines.has(`EMAIL;TYPE=WORK:${siteConfig.email}`));
  assert.ok(lines.has("X-ABShowAs:COMPANY"));
});

test("vCard does not invent a person or leak the private drop-off street", () => {
  const body = buildShopVcard();
  assert.ok(!body.split("\r\n").some((line) => line.startsWith("N:")));
  assert.doesNotMatch(body, /Darby/i);
  assert.doesNotMatch(body, /529/);
  assert.doesNotMatch(body, /29687/);
});

test("QR / NFC target is the short .vcf path, not /card", () => {
  assert.equal(VCARD_PATH, "/c.vcf");
  assert.equal(CANONICAL_VCARD_URL, "https://swaffordspeed.com/c.vcf");
  assert.equal(VCARD_HEADERS["Content-Type"], "text/vcard; charset=utf-8");
  assert.match(VCARD_HEADERS["Content-Disposition"], /^inline;/);
});
