import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { formatMoney } from "@/lib/shopify/money";
import { TrackedLink } from "@/components/TrackedLink";
import type { Product } from "@/lib/shopify/types";

const SHOP_PHOTO =
  "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Fbca7bdd0928f4f368bd3df793ee29cdc?format=webp&width=1920";

export function Hero({ featured }: { featured: Product | null }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-ink pt-24 text-bone sm:pt-28"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${SHOP_PHOTO}')` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-ink via-ink/95 to-ink/90 lg:via-ink/90 lg:to-ink/60"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent"
        aria-hidden="true"
      />
      <LogoMark
        priority
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[30rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.06] lg:block"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 pb-14 sm:px-6 sm:pb-20 lg:grid-cols-[1fr_360px] lg:items-stretch lg:gap-14">
        <div className="flex flex-col justify-center">
          <p className="eyebrow text-ember">
            Harley-Davidson performance &amp; service · Upstate, SC
          </p>

          <h1 className="display-slant mt-4 text-[2.5rem] leading-[0.9] sm:text-6xl xl:text-7xl">
            Dealership trained.
            <span className="block text-ember">Rider focused.</span>
          </h1>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="#book"
              className="btn btn-primary eyebrow h-14 gap-2 px-8 text-sm"
            >
              Request an appointment
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/store"
              className="btn btn-outline eyebrow h-14 border-bone/25 px-7 text-bone hover:border-ember hover:bg-transparent hover:text-ember"
            >
              Shop the store
            </Link>
          </div>
        </div>

        <FeaturedTee product={featured} />
      </div>
    </section>
  );
}

function FeaturedTee({ product }: { product: Product | null }) {
  const href = product ? `/store/products/${product.handle}` : "/store";
  const image = product?.images[0];

  return (
    <TrackedLink
      href={href}
      event="store_click"
      meta={{ location: "hero_featured", handle: product?.handle ?? null }}
      className="group block border border-hairline bg-ink-deep/80 p-4 backdrop-blur-sm transition-colors hover:border-ember/50"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-soft">
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <LogoMark className="h-full w-full p-10 opacity-25" />
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-ember">Featured</p>
          <p className="display-caps mt-1.5 text-xl">
            {product?.title ?? "Shop the collection"}
          </p>
        </div>
        {product && (
          <p className="shrink-0 text-sm text-bone/70">
            {formatMoney(product.priceRange.min)}
          </p>
        )}
      </div>
    </TrackedLink>
  );
}
