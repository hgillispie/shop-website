const SESSION_KEY = "ss_sid";

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage disabled — events still land, just unlinked.
    return "no-session";
  }
}

export type EventName =
  | "booking_start"
  | "booking_step"
  | "booking_back"
  | "booking_submit"
  | "booking_error"
  | "booking_complete"
  | "hero_start_submit"
  | "call_click"
  | "store_click";

export function track(name: EventName, meta?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    name,
    path: window.location.pathname,
    sessionId: sessionId(),
    meta,
  });

  // sendBeacon survives the page unloading, which matters for call_click and
  // store_click — both navigate away immediately.
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/event",
      new Blob([payload], { type: "application/json" }),
    );
    return;
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
