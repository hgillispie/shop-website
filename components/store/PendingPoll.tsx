"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// The webhook, not the client redirect, is the source of truth for
// fulfillment — it can genuinely land after this page has already loaded.
// Poll a few times with a cap rather than assuming instant consistency.
export function PendingPoll() {
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > 10) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, 2000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
