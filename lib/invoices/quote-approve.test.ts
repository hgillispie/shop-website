import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createApproveToken,
  hashApproveToken,
  isQuoteSendPath,
  planQuoteApproval,
  quoteApprovePath,
  quoteApproveUrl,
} from "./quote-approve.ts";

describe("approve tokens", () => {
  it("creates a URL-safe token and hashes it deterministically", () => {
    const token = createApproveToken();
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.ok(token.length >= 40);
    assert.equal(hashApproveToken(token), hashApproveToken(token));
    assert.notEqual(hashApproveToken(token), hashApproveToken(`${token}x`));
    assert.equal(quoteApprovePath(token), `/quote/${token}/approve`);
    assert.equal(
      quoteApproveUrl(token, "https://swaffordspeed.com/"),
      `https://swaffordspeed.com/quote/${token}/approve`,
    );
  });
});

describe("isQuoteSendPath", () => {
  it("sends a quote while payment is not_sent and stage is quote or approved", () => {
    assert.equal(isQuoteSendPath({ paymentStatus: "not_sent", documentStage: "quote" }), true);
    assert.equal(isQuoteSendPath({ paymentStatus: "not_sent", documentStage: "approved" }), true);
  });

  it("does not send a quote after the pay invoice has gone out", () => {
    assert.equal(isQuoteSendPath({ paymentStatus: "invoice_sent", documentStage: "invoice" }), false);
    assert.equal(isQuoteSendPath({ paymentStatus: "paid", documentStage: "invoice" }), false);
    assert.equal(isQuoteSendPath({ paymentStatus: "not_sent", documentStage: "invoice" }), false);
  });
});

describe("planQuoteApproval", () => {
  it("flips quote to approved and asks to notify on the first click", () => {
    const plan = planQuoteApproval({
      documentStage: "quote",
      paymentStatus: "not_sent",
      approvedAt: null,
    });
    assert.deepEqual(plan, {
      alreadyApproved: false,
      nextStage: "approved",
      shouldNotify: true,
    });
  });

  it("is idempotent after approvedAt is set — no second notify, no stage regression", () => {
    const approvedAt = new Date("2026-09-20T12:00:00.000Z");
    assert.deepEqual(
      planQuoteApproval({
        documentStage: "approved",
        paymentStatus: "not_sent",
        approvedAt,
      }),
      { alreadyApproved: true, nextStage: "approved", shouldNotify: false },
    );
    assert.deepEqual(
      planQuoteApproval({
        documentStage: "invoice",
        paymentStatus: "invoice_sent",
        approvedAt,
      }),
      { alreadyApproved: true, nextStage: "invoice", shouldNotify: false },
    );
  });

  it("records approval on an already-invoiced job without moving stage back to approved", () => {
    assert.deepEqual(
      planQuoteApproval({
        documentStage: "invoice",
        paymentStatus: "invoice_sent",
        approvedAt: null,
      }),
      { alreadyApproved: false, nextStage: "invoice", shouldNotify: true },
    );
  });

  it("does not re-notify after the job is paid", () => {
    assert.deepEqual(
      planQuoteApproval({
        documentStage: "invoice",
        paymentStatus: "paid",
        approvedAt: null,
      }),
      { alreadyApproved: true, nextStage: "invoice", shouldNotify: false },
    );
  });
});
