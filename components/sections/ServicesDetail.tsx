import { capabilities } from "@/data/services";

export function ServicesDetail() {
  return (
    <section
      id="services"
      className="scroll-mt-(--header-h) bg-ink py-20 text-bone sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <h2 className="display-caps text-5xl sm:text-6xl">
          Service it. Upgrade it. Make it yours.
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/60">
          From maintenance and diagnostics to power, handling, rider fit, and
          full builds, every setup is planned around the bike and the way you
          ride.
        </p>

        <div className="mt-12 grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability, i) => (
            <article key={capability.title} className="bg-ink p-7 lg:p-8">
              <span className="display-slant text-sm text-flame">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display-caps mt-4 text-2xl">{capability.title}</h3>
              <p className="mt-3.5 text-sm leading-relaxed text-bone/60">
                {capability.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
