"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripeTerminal, type Terminal } from "@stripe/terminal-js";
import type { PrintifyProduct } from "@/lib/printify";
import { formatCents } from "@/lib/store/money";
import {
  createConnectionToken,
  createInPersonOrder,
  createTerminalPaymentIntent,
} from "@/app/admin/(dashboard)/terminal/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type CartLine = {
  printifyProductId: string;
  printifyVariantId: number;
  title: string;
  variantLabel: string | null;
  unitPriceCents: number;
  quantity: number;
};

// Leave `simulated` true — Stripe's simulated reader fakes the entire
// discover/connect/collect flow, so the whole in-person flow can be built
// and demoed with zero hardware. Flip to false only once a real S700 is
// registered to a Stripe Location.
const SIMULATED = true;

export function TerminalCheckout({ products }: { products: PrintifyProduct[] }) {
  const terminalRef = useRef<Terminal | null>(null);
  const [readerStatus, setReaderStatus] = useState<
    "initializing" | "ready" | "reader-disconnected" | "error"
  >("initializing");
  const [readerError, setReaderError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(
    products[0]?.variants.find((v) => v.is_enabled)?.id,
  );
  const [quantity, setQuantity] = useState(1);

  const [chargeStatus, setChargeStatus] = useState<
    "idle" | "creating-order" | "creating-payment" | "present-card" | "processing" | "paid"
  >("idle");
  const [chargeError, setChargeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const StripeTerminal = await loadStripeTerminal();
      if (!StripeTerminal) {
        setReaderStatus("error");
        setReaderError("Could not load Stripe Terminal.");
        return;
      }

      const terminal = StripeTerminal.create({
        onFetchConnectionToken: async () => {
          const { secret } = await createConnectionToken();
          return secret;
        },
        onUnexpectedReaderDisconnect: () => {
          if (!cancelled) setReaderStatus("reader-disconnected");
        },
      });
      terminalRef.current = terminal;

      const discoverResult = await terminal.discoverReaders({ simulated: SIMULATED });
      if (cancelled) return;
      if ("error" in discoverResult) {
        setReaderStatus("error");
        setReaderError(discoverResult.error.message);
        return;
      }
      if (discoverResult.discoveredReaders.length === 0) {
        setReaderStatus("error");
        setReaderError("No reader found — check it's powered on and on the same network.");
        return;
      }

      const connectResult = await terminal.connectReader(discoverResult.discoveredReaders[0]);
      if (cancelled) return;
      if ("error" in connectResult) {
        setReaderStatus("error");
        setReaderError(connectResult.error.message);
        return;
      }
      setReaderStatus("ready");
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const enabledVariants = selectedProduct?.variants.filter((v) => v.is_enabled) ?? [];
  const totalCents = cart.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);

  function addToCart() {
    const variant = enabledVariants.find((v) => v.id === selectedVariantId);
    if (!selectedProduct || !variant) return;

    setCart((prev) => {
      const existing = prev.find(
        (line) =>
          line.printifyProductId === selectedProduct.id && line.printifyVariantId === variant.id,
      );
      if (existing) {
        return prev.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + quantity } : line,
        );
      }
      return [
        ...prev,
        {
          printifyProductId: selectedProduct.id,
          printifyVariantId: variant.id,
          title: selectedProduct.title,
          variantLabel: variant.title,
          unitPriceCents: variant.price,
          quantity,
        },
      ];
    });
    setQuantity(1);
  }

  function removeLine(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCharge() {
    if (!terminalRef.current || cart.length === 0) return;
    setChargeError(null);

    try {
      setChargeStatus("creating-order");
      const { orderRef } = await createInPersonOrder(
        cart.map((line) => ({
          printifyProductId: line.printifyProductId,
          printifyVariantId: line.printifyVariantId,
          quantity: line.quantity,
        })),
      );

      setChargeStatus("creating-payment");
      const { clientSecret } = await createTerminalPaymentIntent(orderRef);
      if (!clientSecret) throw new Error("Could not start payment.");

      setChargeStatus("present-card");
      const collectResult = await terminalRef.current.collectPaymentMethod(clientSecret);
      if ("error" in collectResult) throw new Error(collectResult.error.message);

      setChargeStatus("processing");
      const confirmResult = await terminalRef.current.processPayment(collectResult.paymentIntent);
      if ("error" in confirmResult) throw new Error(confirmResult.error.message);

      // The payment_intent.succeeded webhook (shared with the online flow)
      // is what actually marks the order paid and sends the receipt — this
      // just reflects the result to whoever's running the register.
      setChargeStatus("paid");
      setCart([]);
    } catch (error) {
      setChargeError(error instanceof Error ? error.message : "Something went wrong.");
      setChargeStatus("idle");
    }
  }

  if (products.length === 0) {
    return <p className="text-sm text-muted">No products in the catalog yet.</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <p className="text-xs uppercase text-muted">
          Reader: {readerStatus === "ready" ? "Connected" : readerStatus.replace("-", " ")}
          {SIMULATED ? " (simulated)" : ""}
        </p>
        {readerError && <p className="mt-1 text-xs text-red-600">{readerError}</p>}

        <div className="mt-6 space-y-3 rounded-lg border border-border bg-surface p-4">
          <Select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              const product = products.find((p) => p.id === e.target.value);
              setSelectedVariantId(product?.variants.find((v) => v.is_enabled)?.id);
            }}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </Select>

          <Select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(Number(e.target.value))}
          >
            {enabledVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title} — {formatCents(variant.price)}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="h-10 w-20"
            />
            <Button type="button" variant="outline" size="sm" onClick={addToCart}>
              Add item
            </Button>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase text-muted">Current sale</p>
        <div className="mt-3 space-y-2 rounded-lg border border-border p-4">
          {cart.length === 0 && <p className="text-sm text-muted">No items added yet.</p>}
          {cart.map((line, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>
                {line.quantity}× {line.title}
                {line.variantLabel ? ` — ${line.variantLabel}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <span>{formatCents(line.unitPriceCents * line.quantity)}</span>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="text-xs text-muted hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {cart.length > 0 && (
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span>{formatCents(totalCents)}</span>
            </div>
          )}
        </div>

        {chargeError && (
          <p className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {chargeError}
          </p>
        )}

        {chargeStatus === "paid" ? (
          <p className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Payment complete. Ready for the next sale.
          </p>
        ) : (
          <Button
            type="button"
            size="lg"
            className="mt-4 w-full"
            disabled={readerStatus !== "ready" || cart.length === 0 || chargeStatus !== "idle"}
            onClick={handleCharge}
          >
            {chargeStatus === "idle"
              ? `Charge ${formatCents(totalCents)}`
              : chargeStatus === "present-card"
                ? "Present card to reader…"
                : "Processing…"}
          </Button>
        )}
      </div>
    </div>
  );
}
