import Link from "next/link";
import type { PrintifyProduct } from "@/lib/printify";
import { formatCents } from "@/lib/store/money";

export function ProductCard({ product }: { product: PrintifyProduct }) {
  const enabledVariants = product.variants.filter((v) => v.is_enabled);
  const prices = enabledVariants.map((v) => v.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasRange = new Set(prices).size > 1;

  const image =
    product.images.find((img) => img.is_default) ?? product.images[0] ?? null;

  return (
    <Link
      href={`/store/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-surface"
    >
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
  );
}
