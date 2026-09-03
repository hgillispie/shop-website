import { Check, MapPin } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { LogoMark } from "@/components/brand/Logo";
import { HeroStartForm } from "@/components/sections/HeroStartForm";

const SHOP_PHOTO =
  "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Ff34d3293ef974da897f5007b910db556";

export function Hero() {
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
        className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/60"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink to-transparent"
        aria-hidden="true"
      />

      <LogoMark
        priority
        className="pointer-events-none absolute -right-24 top-1/3 hidden h-[38rem] opacity-[0.06] xl:block"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pb-14 sm:px-6 sm:pb-20 lg:grid-cols-[1fr_minmax(380px,440px)] lg:items-center lg:gap-16">
        <div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="eyebrow inline-flex items-center gap-2 text-ember">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Harley-Davidson performance &amp; service
            </span>
            <span className="eyebrow text-bone/60">{siteConfig.city}</span>
          </div>

          <h1 className="display-slant mt-6 text-[3.25rem] sm:text-7xl lg:text-8xl">
            Dealership trained.
            <span className="mt-1 block text-ember">Rider focused.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-bone/75">
            Upgrades and adjustments planned around how you ride — plus the
            service work that keeps it all together.
          </p>

          <ul className="mt-8 grid gap-3 text-sm text-bone/80 sm:grid-cols-2">
            {siteConfig.heroPoints.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center bg-flame text-ink">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <HeroStartForm />
      </div>

      <div className="relative border-t border-hairline bg-ink-deep/85 backdrop-blur-sm">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 sm:px-6 lg:grid-cols-4">
          {siteConfig.credentials.map((item) => (
            <div key={item.value} className="py-5 pr-4 lg:py-6">
              <dt className="display-caps text-2xl text-bone lg:text-3xl">
                {item.value}
              </dt>
              <dd className="mt-1.5 text-xs leading-snug text-bone/60">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
