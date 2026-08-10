"use client";

import { useEffect } from "react";
import { useCart } from "@/components/store/CartProvider";

export function ClearCartOnSuccess() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // Intentionally run once — clearing on every re-render (e.g. from
    // PendingPoll's router.refresh()) would be harmless but pointless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
