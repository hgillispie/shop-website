"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PrintifyProduct } from "@/lib/printify";
import { useCart } from "@/components/store/CartProvider";
import { formatCents } from "@/lib/store/money";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function AddToCartForm({ product }: { product: PrintifyProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const enabledVariants = useMemo(
    () => product.variants.filter((v) => v.is_enabled),
    [product.variants],
  );
  const [variantId, setVariantId] = useState(
    () => enabledVariants.find((v) => v.is_default)?.id ?? enabledVariants[0]?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = enabledVariants.find((v) => v.id === variantId);

  if (enabledVariants.length === 0) {
    return <p className="text-sm text-muted">This item is currently sold out.</p>;
  }

  function handleAddToCart() {
    if (!selectedVariant) return;

    const image =
      product.images.find((img) => img.variant_ids.includes(selectedVariant.id)) ??
      product.images.find((img) => img.is_default) ??
      product.images[0];

    addItem(
      {
        printifyProductId: product.id,
        printifyVariantId: selectedVariant.id,
        title: product.title,
        variantLabel: selectedVariant.title,
        unitPriceCents: selectedVariant.price,
        imageUrl: image?.src ?? null,
      },
      quantity,
    );
    setAdded(true);
  }

  return (
    <div className="space-y-4">
      {selectedVariant && (
        <p className="text-xl font-semibold">{formatCents(selectedVariant.price)}</p>
      )}

      <div>
        <Label htmlFor="variant">Options</Label>
        <Select
          id="variant"
          value={variantId}
          onChange={(e) => {
            setVariantId(Number(e.target.value));
            setAdded(false);
          }}
        >
          {enabledVariants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.title}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={20}
          value={quantity}
          onChange={(e) => {
            setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)));
            setAdded(false);
          }}
          className="w-24"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={handleAddToCart}>
          {added ? "Added ✓" : "Add to Cart"}
        </Button>
        {added && (
          <button
            type="button"
            onClick={() => router.push("/store/cart")}
            className="text-sm font-medium text-accent hover:underline"
          >
            View cart →
          </button>
        )}
      </div>
    </div>
  );
}
