"use client";

import { useEffect, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "@/components/store/CartProvider";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { ButtonLink } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type StartedCheckout = { orderRef: string; clientSecret: string; subtotalCents: number };

export default function CheckoutPage() {
  const { items, hydrated } = useCart();
  const [checkout, setCheckout] = useState<StartedCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Guards against firing the start call twice — once from the initial
  // mount and again if items' array reference happens to change before the
  // first request resolves (e.g. localStorage hydration settling).
  const startedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || items.length === 0 || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/store/checkout/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineItems: items.map((item) => ({
              printifyProductId: item.printifyProductId,
              printifyVariantId: item.printifyVariantId,
              quantity: item.quantity,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");
        setCheckout(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        startedRef.current = false;
      }
    })();
  }, [hydrated, items]);

  // Only ever true once localStorage has actually been read — avoids a
  // flash of "cart is empty" for a cart that's about to populate.
  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-muted">Your cart is empty.</p>
        <ButtonLink href="/store" className="mt-6 inline-flex">
          Browse the store
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>

      {error && (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!checkout && !error && <p className="mt-8 text-sm text-muted">Loading checkout…</p>}

      {checkout && (
        <div className="mt-8">
          <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
            <CheckoutForm orderRef={checkout.orderRef} initialSubtotalCents={checkout.subtotalCents} />
          </Elements>
        </div>
      )}
    </div>
  );
}
