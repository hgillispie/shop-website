import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-surface-dark pt-16 text-foreground-dark"
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

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            One mechanic. Twenty years. No service adviser in between.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-dark">
            Engine builds, EFI tuning, vintage restoration, and custom
            fabrication — done by one mechanic with twenty years running
            Harley-Davidson service departments, now working on his own terms
            in Taylors, Greenville, and Spartanburg.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href="#book" size="lg">
              Talk to James About My Bike
            </ButtonLink>
            <a
              href="#projects"
              className="text-sm font-medium text-foreground-dark/80 underline-offset-4 hover:text-accent hover:underline"
            >
              See the work
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
