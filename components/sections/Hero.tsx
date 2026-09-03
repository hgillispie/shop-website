import { Check, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { Booking } from "@/components/sections/Booking";
import { siteConfig } from "@/data/site-config";

const HERO_IMAGE =
  "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Ff34d3293ef974da897f5007b910db556";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-brand-ink pt-20 text-white">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-center opacity-50 lg:object-[72%_center]"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(32,30,30,0.98)_0%,rgba(32,30,30,0.88)_42%,rgba(32,30,30,0.58)_70%,rgba(32,30,30,0.72)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(440px,540px)] lg:items-center lg:gap-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-brand-orange">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Harley-Davidson service · Taylors, SC
          </p>
          <h1 className="mt-6 font-display text-6xl uppercase leading-[0.9] tracking-[-0.025em] text-white sm:text-7xl xl:text-[92px]">
            Dealership trained.
            <span className="mt-2 block text-brand-orange">Rider focused.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/75 sm:text-xl">
            Twenty years of Harley-Davidson experience, now in an independent shop where your bike gets the time and attention it deserves.
          </p>

          <ul className="mt-8 grid gap-3 text-sm text-white/80 sm:grid-cols-2">
            {[
              "One bike at a time",
              "Vintage through Milwaukee-Eight",
              "Repairs, builds, and fabrication",
              "Straight answers before work starts",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center bg-brand-orange text-brand-ink">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#book"
              className="inline-flex h-14 items-center justify-center bg-brand-orange px-7 text-sm font-bold uppercase tracking-[0.13em] text-brand-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Tell us about your bike
            </a>
            <a
              href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
              className="inline-flex h-14 items-center justify-center gap-2 border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {siteConfig.phone}
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/45">
            Appointment request only. No payment or commitment required.
          </p>
        </div>

        <Booking />
      </div>

      <div className="brand-checker h-4 border-y border-white/15" aria-hidden="true" />
    </section>
  );
}
