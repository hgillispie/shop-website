"use client";

import { useState } from "react";
import Link from "next/link";
import { ZoomIn } from "lucide-react";
import { formatMoney } from "@/lib/shopify/money";
import { QuickViewModal } from "@/components/store/QuickViewModal";
import type { Product } from "@/lib/shopify/types";

export function ProductCard({ product }: { product: Product }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const image = product.images[0];
  const isRange = product.priceRange.min.amount !== product.priceRange.max.amount;

  return (
    <>
      <Link
        href={`/store/products/${product.handle}`}
        className="group relative block"
      >
        <div className="relative aspect-square overflow-hidden bg-ink-soft">
          {image ? (
            // Printify/Shopify-hosted images, same posture as this repo's
            // other image usage — no next/image remotePatterns configured.
            <img
              src={image.url}
              alt={image.altText ?? product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-bone/50">
              No image
            </div>
          )}

          <button
            type="button"
            aria-label={`Quick view ${product.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewOpen(true);
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-ink/80 text-bone opacity-0 transition-opacity group-hover:opacity-100 hover:text-ember"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <h3 className="display-caps mt-3 text-base text-bone transition-colors group-hover:text-ember">
          {product.title}
        </h3>
        <p className="mt-0.5 text-sm text-bone/60">
          {isRange ? "From " : ""}
          {formatMoney(product.priceRange.min)}
        </p>
      </Link>

      <QuickViewModal
        product={product}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}
