"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/store/actions";
import { Button } from "@/components/ui/button";
import { ShopPayButton } from "@/components/store/ShopPayButton";
import { formatMoney } from "@/lib/shopify/money";
import type { Product, ProductVariant } from "@/lib/shopify/types";

function variantMatches(variant: ProductVariant, selected: Record<string, string>) {
  return variant.selectedOptions.every((opt) => selected[opt.name] === opt.value);
}

export function AddToCartForm({ product }: { product: Product }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  return (
    <div className="flex flex-col gap-4">
      {hasRealOptions &&
        product.options.map((option) => (
          <div key={option.name} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide text-muted uppercase">
              {option.name}
            </label>
            <select
              value={selected[option.name]}
              onChange={(e) =>
                setSelected((prev) => ({ ...prev, [option.name]: e.target.value }))
              }
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
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
        <label className="text-xs font-medium tracking-wide text-muted uppercase">Qty</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="h-11 w-20 rounded-lg border border-border bg-background px-3 text-sm"
        />
      </div>

      {selectedVariant && !selectedVariant.availableForSale ? (
        <p className="text-sm text-muted">This option is sold out.</p>
      ) : null}

      <Button
        type="button"
        onClick={handleAdd}
        disabled={isPending || !selectedVariant || !selectedVariant.availableForSale}
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
          <div className="flex items-center gap-3 text-xs tracking-wide text-muted uppercase">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <ShopPayButton variantId={selectedVariant.id} quantity={quantity} />
        </>
      ) : null}

      {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
    </div>
  );
}
