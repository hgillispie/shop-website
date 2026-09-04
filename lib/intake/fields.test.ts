import assert from "node:assert/strict";
import test from "node:test";
import {
  blankToNull,
  coerceExtraction,
  draftJobTitle,
  extractEmailAddress,
  htmlToText,
  isAllowedTelegramUser,
  isIntakeImageType,
  isUsablePhone,
  parseFromHeader,
  parseOwnerContactReply,
} from "./fields.ts";
import { pickCustomerByName } from "./match.ts";

test("blankToNull strips placeholders", () => {
  assert.equal(blankToNull("  "), null);
  assert.equal(blankToNull("n/a"), null);
  assert.equal(blankToNull("Unknown"), null);
  assert.equal(blankToNull("Pat"), "Pat");
});

test("parseFromHeader handles display names and bare addresses", () => {
  assert.deepEqual(parseFromHeader("Pat Smith <pat@example.com>"), {
    name: "Pat Smith",
    email: "pat@example.com",
  });
  assert.deepEqual(parseFromHeader("owner@shop.com"), {
    name: null,
    email: "owner@shop.com",
  });
  assert.equal(extractEmailAddress("Name <A@B.COM>"), "a@b.com");
});

test("htmlToText keeps line breaks and drops tags", () => {
  const text = htmlToText("<p>Hello</p><br>World &amp; bike");
  assert.match(text, /Hello/);
  assert.match(text, /World & bike/);
});

test("coerceExtraction maps aliases and nulls junk", () => {
  const extracted = coerceExtraction({
    name: "Jamie",
    customerPhone: "864-555-0100",
    bike: "2017 Softail",
    work: "n/a",
    sentimentScore: "90",
    positiveQuotes: [
      "You guys crushed the wiring on my Softail",
      "thanks",
      "You guys crushed the wiring on my Softail",
    ],
    negativeQuotes: "This is taking way too long and I'm frustrated",
  });
  assert.equal(extracted.customerName, "Jamie");
  assert.equal(extracted.phone, "864-555-0100");
  assert.equal(extracted.bikeYearMakeModel, "2017 Softail");
  assert.equal(extracted.workNeeded, null);
  assert.equal(extracted.sentimentScore, 90);
  assert.deepEqual(extracted.positiveQuotes, ["You guys crushed the wiring on my Softail"]);
  assert.deepEqual(extracted.negativeQuotes, ["This is taking way too long and I'm frustrated"]);
});

test("coerceExtraction defaults missing sentiment and quotes", () => {
  const extracted = coerceExtraction({});
  assert.equal(extracted.sentimentScore, null);
  assert.deepEqual(extracted.positiveQuotes, []);
  assert.deepEqual(extracted.negativeQuotes, []);
  assert.equal(extracted.ownerBrief, null);
  assert.equal(extracted.urgency, null);
  assert.deepEqual(extracted.missingInfo, []);
  assert.equal(extracted.matchedFromCrm, false);
});

test("draftJobTitle prefers name + bike", () => {
  assert.equal(
    draftJobTitle({
      customerName: "Jamie",
      bikeYearMakeModel: "2017 Softail",
      subject: "fwd",
    }),
    "Jamie — 2017 Softail",
  );
  assert.equal(
    draftJobTitle({ customerName: null, bikeYearMakeModel: null, subject: "Screenshots" }),
    "Screenshots",
  );
});

test("phone and image helpers", () => {
  assert.equal(isUsablePhone("864-555-0100"), true);
  assert.equal(isUsablePhone("123"), false);
  assert.equal(isIntakeImageType("image/png"), true);
  assert.equal(isIntakeImageType("application/pdf"), false);
});

test("telegram allowlist is open until ids are set", () => {
  assert.equal(isAllowedTelegramUser(42, ""), true);
  assert.equal(isAllowedTelegramUser(42, "42, 99"), true);
  assert.equal(isAllowedTelegramUser(7, "42,99"), false);
});

test("owner can send a phone or contact line instead of using the admin form", () => {
  assert.deepEqual(parseOwnerContactReply("864-555-0100 jamie@shop.test"), {
    phone: "864-555-0100",
    email: "jamie@shop.test",
    acceptedMatch: false,
  });
  assert.equal(parseOwnerContactReply("yes").acceptedMatch, true);
  assert.equal(parseOwnerContactReply("later").phone, null);
});

test("CRM name match requires a unique strong hit", () => {
  const customers = [
    { id: "1", name: "Big Tom Ostrander", phone: "864-555-0259", email: "bigtom@example.com" },
    { id: "2", name: "Marcus Webb", phone: "864-555-0001", email: null },
    { id: "3", name: "Marcus Webb", phone: "864-555-0002", email: null },
  ];
  assert.equal(pickCustomerByName("Tom Ostrander", customers)?.customer.id, "1");
  assert.equal(pickCustomerByName("Marcus", customers), null);
  assert.equal(pickCustomerByName("Nobody", customers), null);
});
