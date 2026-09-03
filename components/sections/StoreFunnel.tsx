import { ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/shopify/money";
import { LogoMark } from "@/components/brand/Logo";
import { TrackedLink } from "@/components/TrackedLink";
import type { Product } from "@/lib/shopify/types";

export function StoreFunnel({ products }: { products: Product[] }) {
  const shown = products.slice(0, 3);

  return (
    <section className="bg-ink px-5 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4 border-b border-hairline pb-5">
          <h2 className="display-caps text-3xl text-bone sm:text-4xl">
            Shop gear
          </h2>
          <TrackedLink
            href="/store"
            event="store_click"
            meta={{ location: "store_strip_header" }}
            className="eyebrow inline-flex shrink-0 items-center gap-2 text-ember hover:text-bone"
          >
            See all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>
        </div>

        {shown.length > 0 ? (
          <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {shown.map((product) => (
              <li key={product.id}>
                <TrackedLink
                  href={`/store/products/${product.handle}`}
                  event="store_click"
                  meta={{ location: "store_strip", handle: product.handle }}
                  className="group block"
                >
                  <div className="aspect-square overflow-hidden bg-ink-soft">
                    {product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].altText ?? product.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <LogoMark className="h-full w-full p-8 opacity-20" />
                    )}
                  </div>
                  <p className="display-caps mt-3 text-base text-bone transition-colors group-hover:text-ember">
                    {product.title}
                  </p>
                  <p className="mt-0.5 text-sm text-bone/60">
                    {formatMoney(product.priceRange.min)}
                  </p>
                </TrackedLink>
              </li>
            ))}
          </ul>
        ) : (
          <TrackedLink
            href="/store"
            event="store_click"
            meta={{ location: "store_strip_empty" }}
            className="group mt-8 flex items-center justify-center gap-6 border border-hairline bg-ink-deep px-6 py-12 text-center transition-colors hover:border-ember/40"
          >
            <LogoMark className="h-20 transition-transform duration-500 group-hover:scale-105" />
            <p className="display-caps text-2xl text-bone sm:text-3xl">
              See what&apos;s in the store
            </p>
          </TrackedLink>
        )}
      </div>
    </section>
  );
}
