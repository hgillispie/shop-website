"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { PrintifyProduct } from "@/lib/printify";
import { formatCents } from "@/lib/store/money";
import { QuickViewModal } from "@/components/store/QuickViewModal";

export function ProductCard({ product }: { product: PrintifyProduct }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const enabledVariants = product.variants.filter((v) => v.is_enabled);
  const prices = enabledVariants.map((v) => v.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasRange = new Set(prices).size > 1;

  const image =
    product.images.find((img) => img.is_default) ?? product.images[0] ?? null;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-surface">
      <Link href={`/store/products/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden bg-background">
          {image && (
            <img
              src={image.src}
              alt={product.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-foreground">{product.title}</h3>
          {minPrice !== null && (
            <p className="mt-1 text-sm text-muted">
              {hasRange ? "From " : ""}
              {formatCents(minPrice)}
            </p>
          )}
          {enabledVariants.length === 0 && (
            <p className="mt-1 text-sm text-muted">Sold out</p>
          )}
        </div>
      </Link>

      {/* Always visible, not hover-gated — a hover-only trigger is
          undiscoverable on touch devices with no hover state at all. */}
      <button
        type="button"
        aria-label={`Quick view ${product.title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setQuickViewOpen(true);
        }}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background hover:text-accent"
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </button>

      <QuickViewModal
        product={product}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </div>
  );
}
