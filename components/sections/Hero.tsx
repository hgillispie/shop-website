import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { LogoMark } from "@/components/brand/Logo";

const SHOP_PHOTO =
  "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Ff34d3293ef974da897f5007b910db556";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden bg-ink pt-24 text-bone"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${SHOP_PHOTO}')` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/35"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink to-transparent"
        aria-hidden="true"
      />

      <LogoMark
        priority
        className="pointer-events-none absolute -right-16 top-1/2 hidden h-[42rem] -translate-y-1/2 opacity-[0.07] lg:block"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-14 sm:px-6 sm:pb-20">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="eyebrow inline-flex items-center gap-2 text-ember">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {siteConfig.city}
          </span>
          <span className="eyebrow text-bone/50">By appointment only</span>
        </div>

        <h1 className="display-slant mt-6 max-w-4xl text-[3.25rem] sm:text-8xl lg:text-[7.5rem]">
          Upstate <span className="text-ember">Harley-Davidson</span>{" "}
          specialists
        </h1>

        <p className="mt-7 max-w-xl text-lg leading-relaxed text-bone/75">
          From seasonal maintenance to custom builds, no job too big or small.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="#book"
            className="btn btn-primary btn-lg eyebrow h-14 px-9 text-sm"
          >
            Request an appointment
          </Link>
          <a
            href={siteConfig.phoneHref}
            className="btn btn-outline btn-lg h-14 gap-2.5 border-bone/25 px-7 text-base font-semibold text-bone hover:border-ember hover:bg-transparent hover:text-ember"
          >
            <Phone className="h-4.5 w-4.5" aria-hidden="true" />
            {siteConfig.phone}
          </a>
        </div>

        <p className="mt-5 text-sm text-bone/45">
          No obligation. Every request is reviewed personally, usually with a
          reply the same day.
        </p>
      </div>

      <div className="relative border-t border-hairline bg-ink-deep/80 backdrop-blur-sm">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 sm:px-6 lg:grid-cols-4">
          {siteConfig.credentials.map((item) => (
            <div key={item.value} className="py-5 pr-4 lg:py-6">
              <dt className="display-caps text-2xl text-bone lg:text-3xl">
                {item.value}
              </dt>
              <dd className="mt-1.5 text-xs leading-snug text-bone/50">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
