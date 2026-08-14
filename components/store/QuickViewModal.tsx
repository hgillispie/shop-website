"use client";

import { useMemo, useState } from "react";
import type { PrintifyProduct } from "@/lib/printify";
import { variantValueFor } from "@/lib/store/variants";
import { formatCents } from "@/lib/store/money";
import { Dialog } from "@/components/ui/dialog";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Front/back/detail photos + color switching, without leaving the grid —
 * reuses ProductGallery and the same color-swatch/variantValueFor pattern
 * as the full product page (AddToCartForm/ProductDetail), just without
 * size selection or add-to-cart. "View full details" is the escape hatch
 * for actually buying — this is for looking, not transacting.
 */
export function QuickViewModal({
  product,
  open,
  onClose,
}: {
  product: PrintifyProduct;
  open: boolean;
  onClose: () => void;
}) {
  const enabledVariants = useMemo(
    () => product.variants.filter((v) => v.is_enabled),
    [product.variants],
  );
  const defaultVariant = enabledVariants.find((v) => v.is_default) ?? enabledVariants[0];

  const colorOption = useMemo(
    () => product.options.find((o) => o.type === "color"),
    [product.options],
  );

  const [colorId, setColorId] = useState<number | undefined>(
    colorOption && defaultVariant ? variantValueFor(defaultVariant, colorOption) : undefined,
  );

  const colors = useMemo(() => {
    if (!colorOption) return [];
    const availableIds = new Set(
      enabledVariants
        .map((v) => variantValueFor(v, colorOption))
        .filter((id): id is number => id !== undefined),
    );
    return colorOption.values.filter((v) => availableIds.has(v.id));
  }, [colorOption, enabledVariants]);

  const galleryImages = useMemo(() => {
    if (!colorOption || colorId === undefined) return product.images;
    const variantIdsForColor = new Set(
      product.variants
        .filter((v) => variantValueFor(v, colorOption) === colorId)
        .map((v) => v.id),
    );
    const filtered = product.images.filter((img) =>
      img.variant_ids.some((variantId) => variantIdsForColor.has(variantId)),
    );
    return filtered.length > 0 ? filtered : product.images;
  }, [product.images, product.variants, colorOption, colorId]);

  const prices = enabledVariants.map((v) => v.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasRange = new Set(prices).size > 1;
  const selectedColorTitle = colors.find((c) => c.id === colorId)?.title;
  const titleId = `quick-view-title-${product.id}`;

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} className="max-w-3xl">
      <div className="grid gap-6 pr-6 sm:grid-cols-2">
        <ProductGallery key={colorId ?? "default"} images={galleryImages} title={product.title} />

        <div>
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            {product.title}
          </h2>
          {minPrice !== null && (
            <p className="mt-2 text-lg font-semibold">
              {hasRange ? "From " : ""}
              {formatCents(minPrice)}
            </p>
          )}

          {colors.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Color{selectedColorTitle ? ` — ${selectedColorTitle}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((value) => (
                  <button
                    key={value.id}
                    type="button"
                    title={value.title}
                    aria-label={value.title}
                    aria-pressed={colorId === value.id}
                    onClick={() => setColorId(value.id)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-shadow",
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

          {enabledVariants.length === 0 && (
            <p className="mt-5 text-sm text-muted">This item is currently sold out.</p>
          )}

          <ButtonLink href={`/store/products/${product.id}`} className="mt-6 w-full justify-center">
            View full details
          </ButtonLink>
        </div>
      </div>
    </Dialog>
  );
}
