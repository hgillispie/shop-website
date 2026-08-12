"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripeTerminal, type Terminal } from "@stripe/terminal-js";
import type { PrintifyProduct } from "@/lib/printify";
import type { InPersonLineItem } from "@/lib/validations/store";
import { formatCents } from "@/lib/store/money";
import {
  createConnectionToken,
  createInPersonOrder,
  createTerminalPaymentIntent,
} from "@/app/admin/(dashboard)/terminal/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CartLine =
  | {
      kind: "merch";
      printifyProductId: string;
      printifyVariantId: number;
      title: string;
      variantLabel: string | null;
      unitPriceCents: number;
      quantity: number;
    }
  | {
      kind: "manual";
      memo: string;
      priceCents: number;
    };

function lineTotalCents(line: CartLine) {
  return line.kind === "merch" ? line.unitPriceCents * line.quantity : line.priceCents;
}

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
  // Optional, whole-sale (not per-line) — passed straight to Stripe's own
  // receipt_email, which sends a card-network-compliant receipt directly.
  // Not stored anywhere else, so it's cleared with the cart after a charge
  // rather than carrying over to the next customer's sale.
  const [email, setEmail] = useState("");

  // Service charge — the primary use of this page day to day (engine work,
  // etc.), entered by hand rather than picked from the Printify catalog.
  const [manualPrice, setManualPrice] = useState("");
  const [manualMemo, setManualMemo] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  // Merch — still available for the occasional shirt/hoodie sale at the
  // counter, secondary to the service-charge flow above.
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
  const totalCents = cart.reduce((sum, line) => sum + lineTotalCents(line), 0);

  function addManualLine() {
    setManualError(null);
    const cents = Math.round(parseFloat(manualPrice) * 100);
    if (!Number.isFinite(cents) || cents < 50) {
      setManualError("Enter a price of at least $0.50.");
      return;
    }
    if (!manualMemo.trim()) {
      setManualError("Enter a description.");
      return;
    }

    setCart((prev) => [...prev, { kind: "manual", priceCents: cents, memo: manualMemo.trim() }]);
    setManualPrice("");
    setManualMemo("");
  }

  function addMerchLine() {
    const variant = enabledVariants.find((v) => v.id === selectedVariantId);
    if (!selectedProduct || !variant) return;

    setCart((prev) => {
      const existing = prev.find(
        (line) =>
          line.kind === "merch" &&
          line.printifyProductId === selectedProduct.id &&
          line.printifyVariantId === variant.id,
      );
      if (existing && existing.kind === "merch") {
        return prev.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + quantity } : line,
        );
      }
      return [
        ...prev,
        {
          kind: "merch",
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
      const lineItems: InPersonLineItem[] = cart.map((line) =>
        line.kind === "merch"
          ? {
              kind: "merch",
              printifyProductId: line.printifyProductId,
              printifyVariantId: line.printifyVariantId,
              quantity: line.quantity,
            }
          : { kind: "manual", priceCents: line.priceCents, memo: line.memo },
      );
      const { orderRef } = await createInPersonOrder({ lineItems, email: email.trim() || undefined });

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
      // is what actually marks the order paid — Stripe sends the receipt
      // itself (see createInPersonOrder) — this just reflects the result to
      // whoever's running the register.
      setChargeStatus("paid");
      setCart([]);
      setEmail("");
    } catch (error) {
      setChargeError(error instanceof Error ? error.message : "Something went wrong.");
      setChargeStatus("idle");
    }
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Service charge
          </p>
          <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
            <div>
              <Label htmlFor="manual-price">Price</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  $
                </span>
                <Input
                  id="manual-price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.50"
                  placeholder="0.00"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="manual-memo">Memo</Label>
              <Input
                id="manual-memo"
                placeholder="e.g. Engine rebuild — Sarah's Shovelhead"
                value={manualMemo}
                onChange={(e) => setManualMemo(e.target.value)}
              />
            </div>
          </div>
          {manualError && <p className="text-xs text-red-600">{manualError}</p>}
          <Button type="button" variant="outline" size="sm" onClick={addManualLine}>
            Add to sale
          </Button>
        </div>

        {products.length > 0 && (
          <div className="mt-6 space-y-3 rounded-lg border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Merch item</p>
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
              <Button type="button" variant="outline" size="sm" onClick={addMerchLine}>
                Add item
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase text-muted">Current sale</p>
        <div className="mt-3 space-y-2 rounded-lg border border-border p-4">
          {cart.length === 0 && <p className="text-sm text-muted">No items added yet.</p>}
          {cart.map((line, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>
                {line.kind === "merch"
                  ? `${line.quantity}× ${line.title}${line.variantLabel ? ` — ${line.variantLabel}` : ""}`
                  : line.memo}
              </span>
              <div className="flex items-center gap-2">
                <span>{formatCents(lineTotalCents(line))}</span>
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

        <div className="mt-4">
          <Label htmlFor="receipt-email">Receipt email (optional)</Label>
          <Input
            id="receipt-email"
            type="email"
            placeholder="customer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            Stripe sends the receipt directly — leave blank to skip a digital receipt.
          </p>
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
