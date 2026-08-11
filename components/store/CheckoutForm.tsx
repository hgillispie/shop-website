"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AddressElement,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { formatCents } from "@/lib/store/money";
import { Button } from "@/components/ui/button";

type ShippingBreakdownEntry = { printProviderId: number; cents: number; estimated?: boolean };

// Mirrors @stripe/stripe-js's StripeAddressElementChangeEvent["value"] —
// defined locally rather than imported since the installed version's type
// entry point doesn't re-export element-specific event types at the
// package's top level.
type AddressValue = {
  name: string;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  phone?: string;
};

type Pricing = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingBreakdown: ShippingBreakdownEntry[];
};

// Debounced so a customer editing their address digit-by-digit doesn't fire
// a Printify shipping lookup + PaymentIntent update on every keystroke —
// only once AddressElement itself reports the address as complete and
// settled.
const PRICE_DEBOUNCE_MS = 600;

export function CheckoutForm({
  orderRef,
  initialSubtotalCents,
}: {
  orderRef: string;
  initialSubtotalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailComplete, setEmailComplete] = useState(false);
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [addressComplete, setAddressComplete] = useState(false);

  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [pricingStatus, setPricingStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [pricingError, setPricingError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guards against a slow request landing after a newer one — always trust
  // the most recent call's result, not just the most recently *started*.
  const requestIdRef = useRef(0);

  const priceShipping = useCallback(async () => {
    if (!emailComplete || !addressComplete || !address) return;

    const requestId = ++requestIdRef.current;
    setPricingStatus("pending");
    setPricingError(null);

    try {
      const res = await fetch("/api/store/checkout/update-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderRef,
          email,
          name: address.name,
          phone: address.phone ?? "",
          address: address.address,
        }),
      });
      const data = await res.json();
      if (requestId !== requestIdRef.current) return; // superseded by a newer call

      if (!res.ok) throw new Error(data.error ?? "Could not calculate shipping.");
      setPricing(data);
      setPricingStatus("done");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setPricingError(err instanceof Error ? err.message : "Could not calculate shipping.");
      setPricingStatus("error");
    }
  }, [emailComplete, addressComplete, address, email, orderRef]);

  useEffect(() => {
    if (!emailComplete || !addressComplete) return;
    const timer = setTimeout(priceShipping, PRICE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // address/email are objects/strings that change on every keystroke —
    // deliberately re-running whenever they do is the point (re-price once
    // things settle), not a dependency-array smell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailComplete, addressComplete, address, email]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || pricingStatus !== "done") return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Only 3D Secure and redirect-based payment methods actually
        // navigate here — plain cards and Link usually resolve in place
        // below, but return_url is still required for the methods that do
        // leave the page. Include our own ref since Stripe appends its own
        // payment_intent/redirect_status params on top of this.
        return_url: `${window.location.origin}/store/order-confirmation?orderRef=${orderRef}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    // Reaching this line means the payment resolved without a redirect —
    // the common case for a plain card. Send the customer to confirmation
    // ourselves rather than assuming return_url always fires.
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      router.push(`/store/order-confirmation?orderRef=${orderRef}`);
      return;
    }

    setSubmitting(false);
  }

  const summary = pricing ?? {
    subtotalCents: initialSubtotalCents,
    shippingCents: 0,
    taxCents: 0,
    totalCents: initialSubtotalCents,
    shippingBreakdown: [] as ShippingBreakdownEntry[],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Contact</p>
        <div className="mt-2">
          <LinkAuthenticationElement
            onChange={(e) => {
              setEmail(e.value.email);
              setEmailComplete(e.complete);
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Shipping address</p>
        <div className="mt-2">
          <AddressElement
            options={{
              mode: "shipping",
              allowedCountries: ["US"],
              fields: { phone: "always" },
              validation: { phone: { required: "always" } },
            }}
            onChange={(e) => {
              setAddress(e.value);
              setAddressComplete(e.complete);
            }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{formatCents(summary.subtotalCents)}</span>
        </div>

        {pricingStatus === "pending" && (
          <div className="flex justify-between text-muted">
            <span>Shipping</span>
            <span>Calculating…</span>
          </div>
        )}

        {pricingStatus === "done" &&
          summary.shippingBreakdown.map((entry, i) => (
            <div key={i} className="flex justify-between text-muted">
              <span>
                Shipping{summary.shippingBreakdown.length > 1 ? ` (shipment ${i + 1})` : ""}
                {entry.estimated ? " (estimated)" : ""}
              </span>
              <span>{formatCents(entry.cents)}</span>
            </div>
          ))}

        {pricingStatus === "idle" && (
          <p className="mt-1 text-xs text-muted">
            Enter your email and shipping address above to calculate shipping.
          </p>
        )}
        {pricingError && <p className="mt-1 text-xs text-red-600">{pricingError}</p>}
        {pricingStatus === "done" && summary.shippingBreakdown.length > 1 && (
          <p className="mt-1 text-xs text-muted">
            Your items ship from more than one supplier, so shipping is charged separately for
            each shipment.
          </p>
        )}
        {pricingStatus === "done" && summary.shippingBreakdown.some((entry) => entry.estimated) && (
          <p className="mt-1 text-xs text-muted">
            We couldn&apos;t get a live shipping quote just now, so that shipment shows an
            estimate — we&apos;ll follow up if the final cost is different.
          </p>
        )}

        <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatCents(summary.totalCents)}</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Payment</p>
        <div className="mt-2">
          <PaymentElement />
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || pricingStatus !== "done" || submitting}
      >
        {submitting
          ? "Processing…"
          : pricingStatus === "done"
            ? `Pay ${formatCents(summary.totalCents)}`
            : "Enter your address to continue"}
      </Button>
    </form>
  );
}
