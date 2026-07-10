import { siteConfig } from "@/data/site-config";

const timeline = [
  {
    role: "Service Manager",
    place: "Greenville Harley-Davidson",
  },
  {
    role: "Technical Lead",
    place: "Sturgis Harley-Davidson",
  },
  {
    role: "Founder & Head Mechanic",
    place: siteConfig.shopName,
  },
];

export function About() {
  return (
    <section id="about" className="scroll-mt-16 bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
              Background
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Dealership-trained. Independently run.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted">
              {siteConfig.builderName} spent his career inside two Harley-Davidson
              dealerships — running service departments and leading technical
              teams — before opening an independent shop built on the same
              standard of work, without the overhead of a big-box floor.
            </p>

            <ol className="mt-10 space-y-6 border-l border-border pl-6">
              {timeline.map((step) => (
                <li key={step.place} className="relative">
                  <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                  <p className="text-sm font-medium text-foreground">{step.role}</p>
                  <p className="text-sm text-muted">{step.place}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-border bg-surface p-8 sm:p-10">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
              Philosophy
            </p>
            <h3 className="text-2xl font-semibold tracking-tight">
              Precision over volume.
            </h3>
            <p className="mt-6 text-base leading-relaxed text-muted">
              This shop takes one bike at a time, by appointment, so every job
              gets the attention a dealership schedule rarely allows. The goal
              isn&apos;t throughput — it&apos;s a bike that starts right,
              runs right, and stays that way. Reliable, mechanically sound
              work, done with the same discipline whether the engine is sixty
              years old or brand new.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
