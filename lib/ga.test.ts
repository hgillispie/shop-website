import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  gaEventNameFor,
  gaParamsFor,
  getGaMeasurementId,
  getGoogleAdsBookConversionSendTo,
  getGoogleAdsId,
  sendGaEvent,
  sendGoogleAdsBookConversion,
  sendPublicTagEvents,
} from "./ga.ts";

const originalGaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const originalAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const originalAdsLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL;

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

afterEach(() => {
  restoreEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", originalGaId);
  restoreEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", originalAdsId);
  restoreEnv("NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL", originalAdsLabel);
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

describe("getGoogleAdsId", () => {
  it("returns undefined when unset, blank, placeholder, or malformed", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    assert.equal(getGoogleAdsId(), undefined);

    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "   ";
    assert.equal(getGoogleAdsId(), undefined);

    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-XXXXXXXXXX";
    assert.equal(getGoogleAdsId(), undefined);

    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-not-digits";
    assert.equal(getGoogleAdsId(), undefined);

    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260';alert(1)";
    assert.equal(getGoogleAdsId(), undefined);
  });

  it("returns a real Ads tag ID", () => {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    assert.equal(getGoogleAdsId(), "AW-18434738260");
  });
});

describe("getGoogleAdsBookConversionSendTo", () => {
  it("returns undefined when the label is unset or placeholder", () => {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL;
    assert.equal(getGoogleAdsBookConversionSendTo(), undefined);

    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "XXXXXXXX";
    assert.equal(getGoogleAdsBookConversionSendTo(), undefined);
  });

  it("joins a bare label with the Ads ID", () => {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "AbC123_xy-Z";
    assert.equal(
      getGoogleAdsBookConversionSendTo(),
      "AW-18434738260/AbC123_xy-Z",
    );
  });

  it("accepts a full send_to even if NEXT_PUBLIC_GOOGLE_ADS_ID is unset", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL =
      "AW-18434738260/AbC123_xy-Z";
    assert.equal(
      getGoogleAdsBookConversionSendTo(),
      "AW-18434738260/AbC123_xy-Z",
    );
  });

  it("rejects a bare label when the Ads ID is missing", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "AbC123";
    assert.equal(getGoogleAdsBookConversionSendTo(), undefined);
  });

  it("rejects values that would break the inline send_to string", () => {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "bad/label/extra";
    assert.equal(getGoogleAdsBookConversionSendTo(), undefined);

    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "no spaces";
    assert.equal(getGoogleAdsBookConversionSendTo(), undefined);
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

  it("still fires generate_lead when an Ads ID is also configured", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "AbC123";
    const calls: unknown[][] = [];
    // @ts-expect-error -- stub gtag for node
    globalThis.window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    };

    sendGaEvent("generate_lead", { method: "appointment_form" });
    sendGaEvent("click_to_call", { location: "nav" });
    assert.deepEqual(calls, [
      ["event", "generate_lead", { method: "appointment_form" }],
      ["event", "click_to_call", { location: "nav" }],
    ]);
  });
});

describe("sendGoogleAdsBookConversion", () => {
  it("is a no-op when the conversion label is unset", () => {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL;
    const calls: unknown[][] = [];
    // @ts-expect-error -- stub gtag for node
    globalThis.window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    };

    assert.doesNotThrow(() => sendGoogleAdsBookConversion());
    assert.equal(calls.length, 0);
  });

  it("fires conversion with send_to and does not emit generate_lead", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "AbC123";
    const calls: unknown[][] = [];
    // @ts-expect-error -- stub gtag for node
    globalThis.window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    };

    sendGoogleAdsBookConversion();
    assert.deepEqual(calls, [
      ["event", "conversion", { send_to: "AW-18434738260/AbC123" }],
    ]);
  });

  it("queues onto dataLayer when gtag has not loaded yet", () => {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "AbC123";
    const dataLayer: unknown[] = [];
    // @ts-expect-error -- window without gtag
    globalThis.window = { dataLayer };

    sendGoogleAdsBookConversion();
    assert.equal(dataLayer.length, 1);
    const queued = dataLayer[0] as { 0: string; 1: string; 2: unknown };
    assert.equal(queued[0], "event");
    assert.equal(queued[1], "conversion");
    assert.deepEqual(queued[2], { send_to: "AW-18434738260/AbC123" });
  });
});

describe("sendPublicTagEvents", () => {
  function stubGtag() {
    const calls: unknown[][] = [];
    // @ts-expect-error -- stub gtag for node
    globalThis.window = {
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    };
    return calls;
  }

  it("fires generate_lead and Ads conversion in parallel on booking success", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "AbC123";
    const calls = stubGtag();

    sendPublicTagEvents("booking_complete");
    assert.deepEqual(calls, [
      ["event", "generate_lead", { method: "appointment_form" }],
      ["event", "conversion", { send_to: "AW-18434738260/AbC123" }],
    ]);
  });

  it("keeps generate_lead when the Ads label is unset", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL;
    const calls = stubGtag();

    sendPublicTagEvents("booking_complete");
    assert.deepEqual(calls, [
      ["event", "generate_lead", { method: "appointment_form" }],
    ]);
  });

  it("does not fire Ads conversion for click_to_call or noisy funnel steps", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-18434738260";
    process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL = "AbC123";
    const calls = stubGtag();

    sendPublicTagEvents("call_click", { location: "nav" });
    sendPublicTagEvents("booking_start");
    sendPublicTagEvents("booking_submit");
    assert.deepEqual(calls, [
      ["event", "click_to_call", { location: "nav" }],
    ]);
  });
});
