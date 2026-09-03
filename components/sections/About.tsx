import { Check, Phone } from "lucide-react";
import Image from "next/image";
import { siteConfig } from "@/data/site-config";

const SHOP_IMAGE =
  "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Ff3d655989a5749679be1ebbef870d703";

export function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-brand-ink text-white">
      <div className="bg-brand-orange text-brand-ink">
        <div className="mx-auto grid max-w-7xl divide-y divide-brand-ink/20 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          {[
            ["20 years", "Harley-Davidson experience"],
            ["One bike", "In the shop at a time"],
            ["By appointment", "No walk-ins or rushed work"],
          ].map(([value, label]) => (
            <div key={value} className="py-6 text-center sm:px-6">
              <p className="font-display text-4xl uppercase leading-none">{value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.13em] opacity-65">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div className="relative min-h-[430px] sm:min-h-[560px]">
          <div className="absolute -left-3 -top-3 h-28 w-28 bg-brand-orange" aria-hidden="true" />
          <Image
            src={SHOP_IMAGE}
            alt="Harley-Davidson restoration work inside Swafford Speed"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover grayscale-[15%]"
          />
          <div className="brand-checker absolute -bottom-4 right-5 h-16 w-40 border-4 border-brand-ink" aria-hidden="true" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-orange">Why Swafford Speed</p>
          <h2 className="mt-5 font-display text-5xl uppercase leading-[0.95] sm:text-6xl">
            The standard of a service department. The attention of an independent shop.
          </h2>
          <p className="mt-7 text-lg leading-8 text-white/65">
            After two decades working in and running Harley-Davidson service departments, Swafford Speed was built around a simpler idea: fewer bikes, better communication, and work that holds up after the ride home.
          </p>

          <ul className="mt-8 space-y-4 border-y border-white/15 py-6 text-sm text-white/75">
            {[
              "Your request is reviewed by the person doing the work",
              "You get a clear conversation before the wrenching starts",
              "Vintage restoration and modern performance live under one roof",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" strokeWidth={3} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#book"
              className="inline-flex h-13 items-center justify-center bg-brand-orange px-6 text-xs font-bold uppercase tracking-[0.13em] text-brand-ink hover:bg-white"
            >
              Request an appointment
            </a>
            <a
              href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
              className="inline-flex h-13 items-center justify-center gap-2 border border-white/25 px-6 text-sm font-semibold text-white hover:border-white"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call {siteConfig.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
