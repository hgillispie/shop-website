import Link from "next/link";
import { formatMoney } from "@/lib/shopify/money";
import type { Product } from "@/lib/shopify/types";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const isRange = product.priceRange.min.amount !== product.priceRange.max.amount;

  return (
    <Link
      href={`/store/products/${product.handle}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 transition-colors hover:border-accent"
    >
      <div className="aspect-square overflow-hidden bg-surface">
        {image ? (
          // Printify/Shopify-hosted images, same posture as this repo's
          // other image usage — no next/image remotePatterns configured.
          <img
            src={image.url}
            alt={image.altText ?? product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-sm font-medium text-foreground">{product.title}</h3>
        <p className="text-sm text-muted">
          {isRange ? "From " : ""}
          {formatMoney(product.priceRange.min)}
        </p>
      </div>
    </Link>
  );
}
