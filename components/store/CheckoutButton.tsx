"use client";

import { ButtonLink } from "@/components/ui/button";
import { sendGaEcommerceEvent, type GaItem } from "@/lib/ga";

export function CheckoutButton({
  href,
  currency,
  value,
  items,
}: {
  href: string;
  currency: string;
  value: number;
  items: GaItem[];
}) {
  return (
    <ButtonLink
      href={href}
      size="lg"
      onClick={() => sendGaEcommerceEvent("begin_checkout", { currency, value, items })}
    >
      Checkout
    </ButtonLink>
  );
}
