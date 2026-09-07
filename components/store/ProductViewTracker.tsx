"use client";

import { useEffect } from "react";
import { sendGaEcommerceEvent } from "@/lib/ga";

export function ProductViewTracker({
  itemId,
  itemName,
  price,
  currency,
}: {
  itemId: string;
  itemName: string;
  price: number;
  currency: string;
}) {
  useEffect(() => {
    sendGaEcommerceEvent("view_item", {
      currency,
      value: price,
      items: [{ item_id: itemId, item_name: itemName, price }],
    });
  }, [currency, itemId, itemName, price]);

  return null;
}
