"use client";

import { useMemo, useState } from "react";
import type { PrintifyProduct } from "@/lib/printify";
import { variantValueFor } from "@/lib/store/variants";
import { ProductGallery } from "@/components/store/ProductGallery";
import { AddToCartForm } from "@/components/store/AddToCartForm";

/**
 * Owns the selected color so the photo gallery and the add-to-cart form
 * can both react to it — Printify tags each product photo with the
 * variant ids it applies to, so switching color re-filters which photos
 * show (e.g. the tee's front/back shots for Maroon vs. for Russet)
 * instead of just re-labeling the same picture.
 */
export function ProductDetail({ product }: { product: PrintifyProduct }) {
  const enabledVariants = useMemo(
    () => product.variants.filter((v) => v.is_enabled),
    [product.variants],
  );
  const defaultVariant = enabledVariants.find((v) => v.is_default) ?? enabledVariants[0];

  // Same "resolve by set membership, never by index" rule as
  // AddToCartForm — Printify's variant.options arrays aren't reliably
  // positional (confirmed against this shop's real catalog: some variants
  // of the same product are ordered [color, size], others [size, color]).
  const colorOption = useMemo(
    () => product.options.find((o) => o.type === "color"),
    [product.options],
  );

  const [colorId, setColorId] = useState<number | undefined>(
    colorOption && defaultVariant ? variantValueFor(defaultVariant, colorOption) : undefined,
  );

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
    // Printify tags every real photo set we've seen with variant ids for
    // one color, but fall back to the full set rather than an empty
    // gallery if some future product's photos aren't tagged that way.
    return filtered.length > 0 ? filtered : product.images;
  }, [product.images, product.variants, colorOption, colorId]);

  return (
    <div className="mt-4 grid gap-10 md:grid-cols-2">
      {/* Remounts on color change so its internal "which photo" index
          resets to the new color's first shot, rather than e.g. staying on
          index 2 and showing a mismatched photo if the arrays differ. */}
      <ProductGallery key={colorId ?? "default"} images={galleryImages} title={product.title} />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
        {product.description && (
          <div
            className="mt-4 space-y-3 text-sm leading-relaxed text-muted [&_p]:mt-0"
            // Printify product descriptions are HTML (already wrapped in
            // their own <p> tags) — a <div> wrapper here, not <p>, since
            // nesting <p> inside <p> is invalid HTML and gets silently
            // restructured differently by the browser's parser between
            // the initial SSR pass and hydration, causing a mismatch.
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        <div className="mt-8">
          <AddToCartForm product={product} colorId={colorId} onColorChange={setColorId} />
        </div>
      </div>
    </div>
  );
}
