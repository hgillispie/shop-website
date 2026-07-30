"use client";

import { useEffect } from "react";

export function AnalyticsBeacon() {
  useEffect(() => {
    const payload = JSON.stringify({
      path: window.location.pathname,
      referrer: document.referrer || null,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/pageview", blob);
    } else {
      fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
    // Fires once per full page load — this is a single-page marketing site,
    // not a client-routed SPA with multiple views.
  }, []);

  return null;
}
