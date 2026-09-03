import { ArrowUpRight, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site-config";

export function StoreCallout() {
  return (
    <section aria-labelledby="store-heading" className="bg-brand-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden border-2 border-brand-ink bg-brand-orange text-brand-ink shadow-[10px_10px_0_#201E1E]">
          <div className="brand-checker h-4 border-b-2 border-brand-ink" aria-hidden="true" />
          <div className="grid min-h-[420px] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative z-10 flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em]">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                The online store
              </p>
              <h2 id="store-heading" className="mt-5 max-w-2xl font-display text-6xl uppercase leading-[0.9] sm:text-7xl">
                Rep the shop beyond the garage.
              </h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-7 text-brand-ink/70">
                Shop Swafford Speed shirts now and keep an eye out for the next run of shop gear.
              </p>
              <Link
                href="/store"
                className="mt-8 inline-flex h-14 w-fit items-center gap-3 bg-brand-ink px-7 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
              >
                Shop the collection
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="relative min-h-[340px] overflow-hidden border-t-2 border-brand-ink bg-brand-ink lg:min-h-full lg:border-l-2 lg:border-t-0">
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(245,130,32,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(245,130,32,0.35)_1px,transparent_1px)] [background-size:36px_36px]" aria-hidden="true" />
              <Image
                src={siteConfig.logoUrl}
                alt="Swafford Speed"
                width={800}
                height={1200}
                sizes="(max-width: 1024px) 70vw, 36vw"
                className="absolute left-1/2 top-1/2 h-[88%] w-auto -translate-x-1/2 -translate-y-1/2 rotate-6 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
