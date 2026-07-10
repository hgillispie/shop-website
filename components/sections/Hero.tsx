import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/data/site-config";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden bg-surface-dark pt-16 text-foreground-dark"
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Appointment-Only Motorcycle Shop
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Bumper-to-bumper mechanics, done with precision.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-dark sm:text-lg">
            Vintage to modern. Electrical to full fabrication. {siteConfig.builderName}
            {" "}brings dealership-trained expertise to an independent shop built
            around one bike at a time.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href="#book" size="lg">
              Request an Appointment
            </ButtonLink>
            <a
              href="#services"
              className="text-sm font-medium text-foreground-dark/80 underline-offset-4 hover:text-accent hover:underline"
            >
              See what we service
            </a>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-border-dark pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-dark">Engines</dt>
            <dd className="mt-1 text-lg font-medium">Panhead → M8</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-dark">Also</dt>
            <dd className="mt-1 text-lg font-medium">Metric V-Twin</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-dark">Background</dt>
            <dd className="mt-1 text-lg font-medium">Two H-D Dealerships</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-dark">Model</dt>
            <dd className="mt-1 text-lg font-medium">By Appointment</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
