import { siteConfig } from "@/data/site-config";

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
              20 years of experience working and running Harley-Davidson
              service departments. At {siteConfig.shopName} you can expect
              the same standard of work without the overhead of a big-box
              floor.
            </p>
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
              runs right, and stays that way.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
