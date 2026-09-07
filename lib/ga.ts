const PLACEHOLDER_ID = "G-XXXXXXXX";

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

function getGtag(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined;
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  return typeof gtag === "function" ? gtag : undefined;
}

/**
 * Fire a GA4 event. No-op when the Measurement ID is unset or gtag hasn't
 * loaded yet — the public site must keep working without GA.
 */
export function sendGaEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (!getGaMeasurementId()) return;
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", name, params);
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
