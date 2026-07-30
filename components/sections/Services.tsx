import { capabilities } from "@/data/services";
import { Reveal } from "@/components/Reveal";

export function Services() {
  return (
    <section id="services" className="scroll-mt-16 bg-surface py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="mb-4 text-base font-medium uppercase tracking-[0.3em] text-accent">
            Capabilities
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Six ways James works on a Harley. All of them by hand.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            From a Stage 2 tune to a numbers-matching Panhead restoration,
            every job in this shop gets the same treatment: pulled apart,
            done right, and explained in plain English before a wrench ever
            turns.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <div key={capability.title} className="bg-background p-8">
              <h3 className="text-lg font-semibold">{capability.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {capability.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-border">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2F9b40fe6b114a414b84925ca6d38bb07f"
            alt="Harley-Davidson engine work inside the Swafford Speed shop, Taylors SC"
            className="h-[320px] w-full object-cover sm:h-[420px]"
          />
        </div>
      </div>
    </section>
  );
}
