import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-surface-dark bg-cover bg-center pt-16 text-foreground-dark"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Fcee12a5000a24d0292047a9e0e8181c1')",
      }}
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
            Upstate Harley-Davidson specialists
          </h1>
          <h3 className="mt-5 text-base leading-relaxed text-muted-dark">
            From seasonal maintainance to custom builds, no job too big or
            small. Call today (843)-666-9451
          </h3>
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
