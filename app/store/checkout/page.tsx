"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "@/components/store/CartProvider";
import { formatCents } from "@/lib/store/money";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OrderSummary = {
  orderRef: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingBreakdown: { printProviderId: number; cents: number; estimated?: boolean }[];
};

const EMPTY_FORM = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  region: "",
  zip: "",
  country: "US",
};

export default function CheckoutPage() {
  const { items } = useCart();
  const [form, setForm] = useState(EMPTY_FORM);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: items.map((item) => ({
            printifyProductId: item.printifyProductId,
            printifyVariantId: item.printifyVariantId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            country: form.country,
            region: form.region,
            address1: form.address1,
            address2: form.address2 || undefined,
            city: form.city,
            zip: form.zip,
          },
          email: form.email,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error ?? "Could not create your order.");
      setOrder(orderData);

      const intentRes = await fetch("/api/store/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef: orderData.orderRef }),
      });
      const intentData = await intentRes.json();
      if (!intentRes.ok) throw new Error(intentData.error ?? "Could not start payment.");
      setClientSecret(intentData.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
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

      {!clientSecret && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={update("email")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" required value={form.firstName} onChange={update("firstName")} />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" required value={form.lastName} onChange={update("lastName")} />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" required value={form.phone} onChange={update("phone")} />
          </div>

          <div>
            <Label htmlFor="address1">Address</Label>
            <Input id="address1" required value={form.address1} onChange={update("address1")} />
          </div>
          <div>
            <Label htmlFor="address2">Apt / suite (optional)</Label>
            <Input id="address2" value={form.address2} onChange={update("address2")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" required value={form.city} onChange={update("city")} />
            </div>
            <div>
              <Label htmlFor="region">State</Label>
              <Input id="region" required value={form.region} onChange={update("region")} />
            </div>
            <div>
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" required value={form.zip} onChange={update("zip")} />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Calculating shipping…" : "Continue to Payment"}
          </Button>
        </form>
      )}

      {order && (
        <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatCents(order.subtotalCents)}</span>
          </div>
          {order.shippingBreakdown.map((entry, i) => (
            <div key={i} className="flex justify-between text-muted">
              <span>
                Shipping{order.shippingBreakdown.length > 1 ? ` (shipment ${i + 1})` : ""}
                {entry.estimated ? " (estimated)" : ""}
              </span>
              <span>{formatCents(entry.cents)}</span>
            </div>
          ))}
          {order.shippingBreakdown.length > 1 && (
            <p className="mt-1 text-xs text-muted">
              Your items ship from more than one supplier, so shipping is charged separately for
              each shipment.
            </p>
          )}
          {order.shippingBreakdown.some((entry) => entry.estimated) && (
            <p className="mt-1 text-xs text-muted">
              We couldn&apos;t get a live shipping quote just now, so that shipment shows an
              estimate — we&apos;ll follow up if the final cost is different.
            </p>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>{formatCents(order.totalCents)}</span>
          </div>
        </div>
      )}

      {clientSecret && order && (
        <div className="mt-8">
          <CheckoutForm clientSecret={clientSecret} orderRef={order.orderRef} />
        </div>
      )}
    </div>
  );
}
