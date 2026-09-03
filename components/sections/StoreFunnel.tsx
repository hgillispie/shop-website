import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/shopify/storefront";
import { formatMoney } from "@/lib/shopify/money";
import { LogoMark } from "@/components/brand/Logo";
import { TrackedLink } from "@/components/TrackedLink";

export async function StoreFunnel() {
  // Same degrade-gracefully posture as /store — the landing page's primary job
  // is the appointment form, and a Shopify outage must not touch it.
  const products = await getProducts({ first: 3 }).catch((error) => {
    console.error("[landing] failed to load featured products:", error);
    return [];
  });

  return (
    <section className="relative overflow-hidden bg-ink-deep py-20 text-bone sm:py-28">
      <div
        className="checkers absolute inset-x-0 top-0 h-3 opacity-30"
        style={
          {
            "--checker-color": "var(--bone)",
            "--checker-size": "12px",
          } as React.CSSProperties
        }
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-ember">The online store</p>
            <h2 className="display-caps mt-5 text-5xl sm:text-6xl">
              Rep the shop beyond the garage.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-bone/60">
              Shop Swafford Speed shirts now and keep an eye out for the next
              run of shop gear.
            </p>
          </div>
          <TrackedLink
            href="/store"
            event="store_click"
            meta={{ location: "store_funnel_header" }}
            className="btn btn-outline eyebrow h-12 shrink-0 gap-2 self-start border-bone/25 px-7 text-bone hover:border-ember hover:bg-transparent hover:text-ember sm:self-auto"
          >
            Shop the collection
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>
        </div>

        {products.length > 0 ? (
          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <TrackedLink
                  href={`/store/products/${product.handle}`}
                  event="store_click"
                  meta={{ location: "store_funnel_product", handle: product.handle }}
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
                      <LogoMark className="h-full w-full p-12 opacity-20" />
                    )}
                  </div>
                  <h3 className="display-caps mt-4 text-xl transition-colors group-hover:text-ember">
                    {product.title}
                  </h3>
                  <p className="mt-1 text-sm text-bone/50">
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
            meta={{ location: "store_funnel_empty" }}
            className="group mt-12 flex flex-col items-center gap-6 border border-hairline bg-ink px-6 py-14 text-center transition-colors hover:border-ember/40 sm:flex-row sm:justify-center sm:gap-10 sm:text-left"
          >
            <LogoMark className="h-28 transition-transform duration-500 group-hover:scale-105" />
            <div>
              <p className="display-caps text-3xl sm:text-4xl">
                New drops land in the store
              </p>
              <p className="mt-3 text-bone/55">
                Have a look at what&apos;s available right now.
              </p>
            </div>
          </TrackedLink>
        )}
      </div>
    </section>
  );
}
