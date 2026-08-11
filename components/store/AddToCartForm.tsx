"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { PrintifyProduct, PrintifyVariant } from "@/lib/printify";
import { useCart } from "@/components/store/CartProvider";
import { formatCents } from "@/lib/store/money";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AddToCartForm({ product }: { product: PrintifyProduct }) {
  const router = useRouter();
  const { addItem } = useCart();

  const enabledVariants = useMemo(
    () => product.variants.filter((v) => v.is_enabled),
    [product.variants],
  );
  const defaultVariant: PrintifyVariant | undefined =
    enabledVariants.find((v) => v.is_default) ?? enabledVariants[0];

  // Printify's option arrays are positional (variant.options[i] lines up
  // with product.options[i]), not keyed by type — find each axis by type
  // once, then always read/write through its index rather than assuming
  // color is index 0 and size is index 1.
  const colorOption = useMemo(
    () => product.options.find((o) => o.type === "color"),
    [product.options],
  );
  const sizeOption = useMemo(
    () => product.options.find((o) => o.type === "size"),
    [product.options],
  );
  const colorIndex = colorOption ? product.options.indexOf(colorOption) : -1;
  const sizeIndex = sizeOption ? product.options.indexOf(sizeOption) : -1;
  const hasColorSize = colorIndex !== -1 || sizeIndex !== -1;

  // Printify's option value lists cover everything the blueprint supports —
  // most colors/sizes aren't actually enabled for any variant of THIS
  // product, so filter down to ones an enabled variant actually uses.
  const colors = useMemo(() => {
    if (colorIndex === -1 || !colorOption) return [];
    const availableIds = new Set(enabledVariants.map((v) => v.options[colorIndex]));
    return colorOption.values.filter((v) => availableIds.has(v.id));
  }, [colorOption, colorIndex, enabledVariants]);

  const [colorId, setColorId] = useState<number | undefined>(
    colorIndex !== -1 ? defaultVariant?.options[colorIndex] : undefined,
  );
  const [sizeId, setSizeId] = useState<number | undefined>(
    sizeIndex !== -1 ? defaultVariant?.options[sizeIndex] : undefined,
  );
  // Only used for products that don't fit the color+size shape at all
  // (e.g. a future sticker/flag with some other single option, or none).
  const [fallbackVariantId, setFallbackVariantId] = useState(defaultVariant?.id);

  const sizesForColor = useMemo(() => {
    if (sizeIndex === -1 || !sizeOption) return [];
    const matching =
      colorIndex === -1
        ? enabledVariants
        : enabledVariants.filter((v) => v.options[colorIndex] === colorId);
    const availableIds = new Set(matching.map((v) => v.options[sizeIndex]));
    return sizeOption.values.filter((v) => availableIds.has(v.id));
  }, [sizeOption, sizeIndex, colorIndex, colorId, enabledVariants]);

  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");

  const selectedVariant = useMemo(() => {
    if (!hasColorSize) {
      return enabledVariants.find((v) => v.id === fallbackVariantId) ?? enabledVariants[0];
    }
    return enabledVariants.find((v) => {
      const colorMatches = colorIndex === -1 || v.options[colorIndex] === colorId;
      const sizeMatches = sizeIndex === -1 || v.options[sizeIndex] === sizeId;
      return colorMatches && sizeMatches;
    });
  }, [hasColorSize, enabledVariants, fallbackVariantId, colorIndex, colorId, sizeIndex, sizeId]);

  const selectedColorTitle = colors.find((c) => c.id === colorId)?.title;

  function selectColor(id: number) {
    setColorId(id);
    setStatus("idle");
    // Keep the current size if it's still offered in the new color;
    // otherwise fall back to that color's first available size.
    if (sizeIndex === -1) return;
    const stillOffered = enabledVariants.some(
      (v) => v.options[colorIndex] === id && v.options[sizeIndex] === sizeId,
    );
    if (!stillOffered) {
      const next = enabledVariants.find((v) => v.options[colorIndex] === id);
      setSizeId(next?.options[sizeIndex]);
    }
  }

  if (enabledVariants.length === 0) {
    return <p className="text-sm text-muted">This item is currently sold out.</p>;
  }

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setStatus("adding");

    const image =
      product.images.find((img) => img.variant_ids.includes(selectedVariant.id)) ??
      product.images.find((img) => img.is_default) ??
      product.images[0];

    // The cart itself is local (localStorage, no network round trip), so
    // this delay is manufactured — without it the button flips state
    // instantly and reads as broken rather than "it worked."
    await new Promise((resolve) => setTimeout(resolve, 450));

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
    setStatus("added");
  }

  return (
    <div className="space-y-5">
      {selectedVariant && (
        <p className="text-xl font-semibold">{formatCents(selectedVariant.price)}</p>
      )}

      {colors.length > 0 && (
        <div>
          <Label>Color{selectedColorTitle ? ` — ${selectedColorTitle}` : ""}</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((value) => (
              <button
                key={value.id}
                type="button"
                title={value.title}
                aria-label={value.title}
                aria-pressed={colorId === value.id}
                onClick={() => selectColor(value.id)}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-shadow",
                  colorId === value.id
                    ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                    : "border-border hover:border-foreground/40",
                )}
                style={{ backgroundColor: value.colors?.[0] ?? "#ccc" }}
              />
            ))}
          </div>
        </div>
      )}

      {sizesForColor.length > 0 && (
        <div>
          <Label>Size</Label>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((value) => (
              <button
                key={value.id}
                type="button"
                aria-pressed={sizeId === value.id}
                onClick={() => {
                  setSizeId(value.id);
                  setStatus("idle");
                }}
                className={cn(
                  "h-10 min-w-10 rounded-md border px-3 text-sm font-medium transition-colors",
                  sizeId === value.id
                    ? "border-accent bg-accent text-white"
                    : "border-border text-foreground hover:border-accent hover:text-accent",
                )}
              >
                {value.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasColorSize && enabledVariants.length > 1 && (
        // Fallback for a product that doesn't fit the color+size shape —
        // this shop's shirts/hoodies all do, but a future sticker/flag with
        // some other single option shouldn't crash this page.
        <div>
          <Label htmlFor="variant">Options</Label>
          <Select
            id="variant"
            value={fallbackVariantId}
            onChange={(e) => {
              setFallbackVariantId(Number(e.target.value));
              setStatus("idle");
            }}
          >
            {enabledVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title}
              </option>
            ))}
          </Select>
        </div>
      )}

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
            setStatus("idle");
          }}
          className="w-24"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant || status === "adding"}
          className="w-40 justify-center"
        >
          {status === "adding" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Adding…
            </>
          ) : status === "added" ? (
            "Added ✓"
          ) : (
            "Add to Cart"
          )}
        </Button>
        {status === "added" && (
          <button
            type="button"
            onClick={() => router.push("/store/cart")}
            className="text-sm font-medium text-accent hover:underline"
          >
            View cart →
          </button>
        )}
      </div>

      {!selectedVariant && (
        <p className="text-xs text-red-600">That combination isn&apos;t available.</p>
      )}
    </div>
  );
}
