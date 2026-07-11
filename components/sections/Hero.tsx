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

      <div className="relative mx-auto w-full max-w-6xl px-6 py-24">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Harley-Davidson repair, by appointment.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-dark sm:text-lg">
            {siteConfig.builderName} spent his career in Harley-Davidson dealership
            service departments and now runs an independent shop focused
            exclusively on Harleys — from Panhead-era bikes to the current M8.
            No metric bikes, no dirt bikes.
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
      </div>
    </section>
  );
}
