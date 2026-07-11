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
            Upstate Harley-Davidson specialists
          </h1>
          <h3 className="mt-5 font-[Arial,sans-serif] font-semibold text-white opacity-100">
            From seasonal maintainance to custom builds, no job too big or
            small. Call today (828) 748-7178
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

      <div className="relative h-[320px] w-full sm:h-[420px] md:h-[520px]">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2F9b40fe6b114a414b84925ca6d38bb07f"
          alt="Harley-Davidson restoration work area"
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  );
}
