const PLACEHOLDER_ID = "G-XXXXXXXX";
const ADS_PLACEHOLDER_ID = "AW-XXXXXXXXXX";
const ADS_PLACEHOLDER_LABEL = "XXXXXXXX";
/** Hunter's Ads tag — `AW-` plus digits only, interpolated into an inline script. */
const ADS_ID_RE = /^AW-\d+$/;
const ADS_LABEL_RE = /^[A-Za-z0-9_-]+$/;
const ADS_SEND_TO_RE = /^AW-\d+\/[A-Za-z0-9_-]+$/;

export type GaItem = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

type GtagFn = (...args: unknown[]) => void;

/** First-party events that also matter for Google Ads conversions. */
const FIRST_PARTY_TO_GA = {
  booking_complete: "generate_lead",
  call_click: "click_to_call",
} as const;

export function getGaMeasurementId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id || id === PLACEHOLDER_ID) return undefined;
  return id;
}

export function getGoogleAdsId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
  if (!id || id === ADS_PLACEHOLDER_ID) return undefined;
  if (!ADS_ID_RE.test(id)) return undefined;
  return id;
}

/**
 * `send_to` for the Book appointment conversion. Accepts the label alone
 * (`XXXX`) or the full Ads snippet value (`AW-18434738260/XXXX`).
 */
export function getGoogleAdsBookConversionSendTo(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CONVERSION_LABEL?.trim();
  if (!raw || raw === ADS_PLACEHOLDER_LABEL) return undefined;

  if (raw.includes("/")) {
    return ADS_SEND_TO_RE.test(raw) ? raw : undefined;
  }

  if (!ADS_LABEL_RE.test(raw)) return undefined;
  const adsId = getGoogleAdsId();
  if (!adsId) return undefined;
  return `${adsId}/${raw}`;
}

export function gaEventNameFor(name: string): string | undefined {
  return FIRST_PARTY_TO_GA[name as keyof typeof FIRST_PARTY_TO_GA];
}

export function gaParamsFor(
  name: string,
  meta?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (name === "booking_complete") {
    return { method: "appointment_form", ...meta };
  }
  return meta;
}

type GaWindow = Window & {
  gtag?: GtagFn;
  dataLayer?: unknown[];
};

/**
 * Push a gtag command. If gtag.js has not finished loading yet, queue onto
 * dataLayer the same way Google's snippet does so mount-time events
 * (e.g. view_item) are not dropped.
 */
function pushGtagCommand(...args: unknown[]): void {
  if (typeof window === "undefined") return;

  const w = window as GaWindow;
  if (typeof w.gtag === "function") {
    w.gtag(...args);
    return;
  }

  w.dataLayer = w.dataLayer ?? [];
  const queue = function () {
    w.dataLayer!.push(arguments);
  } as GtagFn;
  queue(...args);
}

/**
 * Fire a GA4 event. No-op when the Measurement ID is unset — the public site
 * must keep working without GA.
 */
export function sendGaEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (!getGaMeasurementId()) return;
  pushGtagCommand("event", name, params);
}

/**
 * Fire the Google Ads `conversion` event for a successful booking.
 * No-op until Hunter pastes the conversion label (or full `send_to`) in Vercel.
 */
export function sendGoogleAdsBookConversion(): void {
  const sendTo = getGoogleAdsBookConversionSendTo();
  if (!sendTo) return;
  pushGtagCommand("event", "conversion", { send_to: sendTo });
}

/** GA4 + Ads tags for a first-party public-site event. Ads conversion is additive. */
export function sendPublicTagEvents(
  name: string,
  meta?: Record<string, unknown>,
): void {
  const gaName = gaEventNameFor(name);
  if (gaName) sendGaEvent(gaName, gaParamsFor(name, meta));
  if (name === "booking_complete") sendGoogleAdsBookConversion();
}

export function sendGaEcommerceEvent(
  name: "view_item" | "add_to_cart" | "begin_checkout",
  input: {
    currency: string;
    value: number;
    items: GaItem[];
  },
): void {
  sendGaEvent(name, input);
}
