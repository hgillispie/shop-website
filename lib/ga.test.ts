import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  gaEventNameFor,
  gaParamsFor,
  getGaMeasurementId,
  sendGaEvent,
} from "./ga.ts";

const originalId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

afterEach(() => {
  if (originalId === undefined) {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  } else {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalId;
  }
  // @ts-expect-error -- jsdom-less node tests
  delete globalThis.window;
});

describe("getGaMeasurementId", () => {
  it("returns undefined when unset, blank, or the example placeholder", () => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    assert.equal(getGaMeasurementId(), undefined);

    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "   ";
    assert.equal(getGaMeasurementId(), undefined);

    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-XXXXXXXX";
    assert.equal(getGaMeasurementId(), undefined);
  });

  it("returns a real Measurement ID", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234";
    assert.equal(getGaMeasurementId(), "G-TEST1234");
  });
});

describe("first-party → GA4 conversion names", () => {
  it("maps booking success to generate_lead and phone clicks to click_to_call", () => {
    assert.equal(gaEventNameFor("booking_complete"), "generate_lead");
    assert.equal(gaEventNameFor("call_click"), "click_to_call");
  });

  it("does not map noisy funnel steps", () => {
    assert.equal(gaEventNameFor("booking_start"), undefined);
    assert.equal(gaEventNameFor("booking_step"), undefined);
    assert.equal(gaEventNameFor("booking_submit"), undefined);
    assert.equal(gaEventNameFor("store_click"), undefined);
  });

  it("tags generate_lead with the appointment form method", () => {
    assert.deepEqual(gaParamsFor("booking_complete"), {
      method: "appointment_form",
    });
    assert.deepEqual(gaParamsFor("call_click", { location: "nav" }), {
      location: "nav",
    });
  });
});

describe("sendGaEvent", () => {
  it("is a no-op when the Measurement ID is unset", () => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const calls: unknown[][] = [];
    // @ts-expect-error -- stub gtag for node
    globalThis.window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    };

    assert.doesNotThrow(() => sendGaEvent("generate_lead"));
    assert.equal(calls.length, 0);
  });

  it("calls gtag when a Measurement ID is set", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234";
    const calls: unknown[][] = [];
    // @ts-expect-error -- stub gtag for node
    globalThis.window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    };

    sendGaEvent("generate_lead", { method: "appointment_form" });
    assert.deepEqual(calls, [
      ["event", "generate_lead", { method: "appointment_form" }],
    ]);
  });

  it("queues onto dataLayer when gtag has not loaded yet", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234";
    const dataLayer: unknown[] = [];
    // @ts-expect-error -- window without gtag
    globalThis.window = { dataLayer };

    sendGaEvent("view_item", { currency: "USD", value: 10 });
    assert.equal(dataLayer.length, 1);
    const queued = dataLayer[0] as { 0: string; 1: string; 2: unknown };
    assert.equal(queued[0], "event");
    assert.equal(queued[1], "view_item");
    assert.deepEqual(queued[2], { currency: "USD", value: 10 });
  });
});
