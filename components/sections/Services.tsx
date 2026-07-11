import { capabilities } from "@/data/services";

export function Services() {
  return (
    <section id="services" className="scroll-mt-16 bg-surface py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="mb-4 text-base font-medium uppercase tracking-[0.3em] text-accent">
            Services offered
          </p>
        </div>

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
            alt="Harley-Davidson restoration work area"
            className="h-[320px] w-full object-cover sm:h-[420px]"
          />
        </div>
      </div>
    </section>
  );
}
