"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function PaymentForm({ orderRef }: { orderRef: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || submitting}>
        {submitting ? "Processing…" : "Pay now"}
      </Button>
    </form>
  );
}

export function CheckoutForm({
  clientSecret,
  orderRef,
}: {
  clientSecret: string;
  orderRef: string;
}) {
  const options = useMemo(() => ({ clientSecret }), [clientSecret]);

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm orderRef={orderRef} />
    </Elements>
  );
}
