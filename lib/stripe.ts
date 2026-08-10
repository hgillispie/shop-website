import "server-only";
import Stripe from "stripe";
import type { StoreOrderRow } from "@/lib/db/schema";

// Same lazy-singleton shape as lib/sms.ts: read env once at module scope,
// build the client once, never throw at import time — only a real call
// against a missing client fails, and every call site here already checks
// for that explicitly rather than assuming it's configured.
function createClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Explicit apiVersion, cast to bypass a real cross-package type conflict:
  // @stripe/terminal-js bundles its own separate, much older copy of the
  // "stripe" types package (pinned to API version "2020-08-27"), and that
  // stale literal leaks into this file's `Stripe` type resolution in the
  // shared TS program. The current account API version is correct at
  // runtime regardless — this only works around the type-level mismatch.
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" as Stripe.LatestApiVersion });
}

const client = createClient();

export function getStripe(): Stripe {
  if (!client) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  return client;
}

/**
 * The one place that turns a stored order into a PaymentIntent amount.
 * Always derives `amount` from `order.totalCents` — the DB row written by
 * lib/store/pricing.ts — never from anything a client sends at payment time.
 */
export async function createPaymentIntentForOrder(
  order: StoreOrderRow,
  { cardPresent }: { cardPresent: boolean },
) {
  const stripe = getStripe();

  return stripe.paymentIntents.create({
    amount: order.totalCents,
    currency: "usd",
    metadata: { orderRef: order.id },
    ...(cardPresent
      ? {
          payment_method_types: ["card_present"],
          capture_method: "automatic",
        }
      : {
          // Surfaces Link/cards/wallets automatically — no separate Link
          // integration needed.
          automatic_payment_methods: { enabled: true },
          receipt_email: order.email ?? undefined,
        }),
  });
}
