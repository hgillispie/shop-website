"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/store/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/shopify/money";
import type { Product, ProductVariant } from "@/lib/shopify/types";

function variantMatches(variant: ProductVariant, selected: Record<string, string>) {
  return variant.selectedOptions.every((opt) => selected[opt.name] === opt.value);
}

export function AddToCartForm({ product }: { product: Product }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isBuyingNow, startBuyNowTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  // Simplest correct default: first listed value per option. Not "smart"
  // about cross-option availability (e.g. picking an in-stock combo) —
  // fine for a small catalog, and sold-out combos are already surfaced
  // below rather than silently allowed through.
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.options.map((o) => [o.name, o.values[0]])),
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => product.variants.find((v) => variantMatches(v, selected)) ?? null,
    [product.variants, selected],
  );

  const hasRealOptions = product.options.some((o) => o.values.length > 1);

  function handleAdd() {
    if (!selectedVariant) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        await addToCartAction(selectedVariant.id, quantity);
        setFeedback("Added to cart.");
        router.refresh();
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : "Couldn't add to cart.");
      }
    });
  }

  // Adds the line then takes the buyer straight to Shopify's own checkout —
  // the same neutral page the regular /store/cart "Checkout" link goes to
  // (full Express Checkout row: Shop/PayPal/Apple Pay/Google Pay shown
  // equally), just skipping the intermediate cart-review step. Deliberately
  // NOT the Shop Pay web component this replaced — that button jumped
  // straight into Shop's own account/sign-in flow on shop.app before
  // showing any other payment method, which is the opposite of what a
  // guest buyer wants here. window.location.href, not the Next router —
  // checkoutUrl is a real cross-origin redirect to Shopify's own domain.
  function handleBuyNow() {
    if (!selectedVariant) return;
    setFeedback(null);
    startBuyNowTransition(async () => {
      try {
        const { checkoutUrl } = await addToCartAction(selectedVariant.id, quantity);
        window.location.href = checkoutUrl;
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : "Couldn't start checkout.");
      }
    });
  }

  const busy = isPending || isBuyingNow;

  return (
    <div className="flex flex-col gap-4">
      {hasRealOptions &&
        product.options.map((option) => (
          <div key={option.name} className="flex flex-col gap-1.5">
            <label className="eyebrow text-ember">{option.name}</label>
            <select
              value={selected[option.name]}
              onChange={(e) =>
                setSelected((prev) => ({ ...prev, [option.name]: e.target.value }))
              }
              className="select select-bordered h-11 w-full"
            >
              {option.values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}

      <div className="flex items-center gap-3">
        <label className="eyebrow text-ember">Qty</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="input input-bordered h-11 w-20"
        />
      </div>

      {selectedVariant && !selectedVariant.availableForSale ? (
        <p className="text-sm text-bone/60">This option is sold out.</p>
      ) : null}

      <Button
        type="button"
        onClick={handleAdd}
        disabled={busy || !selectedVariant || !selectedVariant.availableForSale}
        size="lg"
      >
        {isPending
          ? "Adding…"
          : selectedVariant
            ? `Add to cart — ${formatMoney(selectedVariant.price)}`
            : "Unavailable"}
      </Button>

      {selectedVariant && selectedVariant.availableForSale ? (
        <>
          <div className="eyebrow flex items-center gap-3 text-bone/50">
            <span className="h-px flex-1 bg-hairline" />
            or
            <span className="h-px flex-1 bg-hairline" />
          </div>
          <Button type="button" variant="outline" onClick={handleBuyNow} disabled={busy} size="lg">
            {isBuyingNow ? "Redirecting…" : "Buy now"}
          </Button>
        </>
      ) : null}

      {feedback ? <p className="text-sm text-bone/60">{feedback}</p> : null}
    </div>
  );
}
