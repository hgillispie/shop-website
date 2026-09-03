import { ArrowDownRight } from "lucide-react";
import { capabilities } from "@/data/services";

export function Services() {
  return (
    <section id="services" className="scroll-mt-24 bg-brand-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-rust">What rolls through the door</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-[0.95] text-brand-ink sm:text-6xl">
              Service it. Upgrade it. Make it yours.
            </h2>
          </div>
          <div className="lg:justify-self-end lg:max-w-xl">
            <p className="text-base leading-7 text-brand-ink/60">
              From maintenance and diagnostics to power, handling, rider fit, and full builds, every setup is planned around the bike and the way you ride.
            </p>
            <a
              href="#book"
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-rust underline decoration-2 underline-offset-4 hover:text-brand-ink"
            >
              Start your build or service request <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-12 grid border-l border-t border-brand-ink/20 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability, index) => (
            <article
              key={capability.title}
              className="group min-h-64 border-b border-r border-brand-ink/20 bg-brand-cream p-7 transition-colors hover:bg-white sm:p-8"
            >
              <div className="flex items-start justify-between gap-6">
                <span className="font-mono text-xs font-bold text-brand-rust">0{index + 1}</span>
                <ArrowDownRight className="h-5 w-5 text-brand-ink/20 transition-colors group-hover:text-brand-rust" aria-hidden="true" />
              </div>
              <h3 className="mt-9 font-display text-2xl uppercase leading-none text-brand-ink">
                {capability.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-brand-ink/55">
                {capability.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
