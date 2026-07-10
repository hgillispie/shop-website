import { capabilities, engineExpertise } from "@/data/services";

export function Services() {
  return (
    <section id="services" className="scroll-mt-16 bg-surface py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Capabilities
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Bumper-to-bumper, on any generation of engine.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            From a numbers-matching Panhead to a current-model Milwaukee-Eight
            or a metric V-twin, the diagnostic and mechanical approach is the
            same: find the actual problem, fix it correctly.
          </p>
        </div>

        <ul className="mt-10 flex flex-wrap gap-3">
          {engineExpertise.map((engine) => (
            <li
              key={engine.name}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm"
            >
              <span className="font-medium">{engine.name}</span>
              <span className="ml-2 text-xs text-muted">{engine.era}</span>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <div key={capability.title} className="bg-background p-8">
              <h3 className="text-lg font-semibold">{capability.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
