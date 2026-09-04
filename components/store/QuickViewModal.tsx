"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { ProductGallery } from "@/components/store/ProductGallery";
import { AddToCartForm } from "@/components/store/AddToCartForm";
import type { Product } from "@/lib/shopify/types";

export function QuickViewModal({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = `quick-view-${product.id}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      className="max-w-3xl border border-hairline bg-ink-soft text-bone"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-4">
          <div>
            <h2 id={titleId} className="display-caps text-2xl text-bone">
              {product.title}
            </h2>
            {product.description ? (
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-bone/65">
                {product.description}
              </p>
            ) : null}
          </div>

          <AddToCartForm product={product} />

          <Link
            href={`/store/products/${product.handle}`}
            className="eyebrow text-center text-bone/55 transition-colors hover:text-ember"
            onClick={onClose}
          >
            View full details
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
