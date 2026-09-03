import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { formatMoney } from "@/lib/shopify/money";
import { TrackedLink } from "@/components/TrackedLink";
import type { Product } from "@/lib/shopify/types";

export function ProductBanner({ product }: { product: Product | null }) {
  const href = product ? `/store/products/${product.handle}` : "/store";
  const image = product?.images[0];

  return (
    <section className="bg-ink px-5 pb-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <TrackedLink
          href={href}
          event="store_click"
          meta={{ location: "new_banner", handle: product?.handle ?? null }}
          className="group grid overflow-hidden border-2 border-flame bg-flame text-ink sm:grid-cols-[1fr_0.8fr]"
        >
          <div className="order-2 flex flex-col justify-center gap-4 p-7 sm:order-1 sm:p-10">
            <span className="display-slant w-fit bg-ink px-3 py-1.5 text-sm text-bone">
              New!
            </span>
            <p className="display-caps text-4xl sm:text-5xl">
              {product?.title ?? "Bagger Pocket Tee"}
            </p>
            {product && (
              <p className="text-lg font-semibold">
                {formatMoney(product.priceRange.min)}
              </p>
            )}
            <span className="eyebrow mt-1 inline-flex items-center gap-2">
              Shop it
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>

          <div className="order-1 aspect-4/3 overflow-hidden bg-ink sm:order-2 sm:aspect-auto">
            {image ? (
              <img
                src={image.url}
                alt={image.altText ?? product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <LogoMark className="h-full w-full p-10 opacity-30" />
            )}
          </div>
        </TrackedLink>
      </div>
    </section>
  );
}
