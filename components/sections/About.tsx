import { siteConfig } from "@/data/site-config";
import { Reveal } from "@/components/Reveal";

export function About() {
  return (
    <section
      id="about"
      className="scroll-mt-16 bg-background bg-cover bg-center py-24"
      style={{
        backgroundImage:
          "url('https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Ff273d1674aaf4bb18b81fc14b6b96324')",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 md:grid-cols-2">
          <Reveal>
            <p className="mb-4 text-base font-medium uppercase tracking-[0.3em] text-accent">
              About
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Dealership-trained. Independently run.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-white">
              {siteConfig.builderName} spent twenty years running
              Harley-Davidson service departments before opening his own bay.
              At {siteConfig.shopName}, you talk to the person actually
              turning the wrench — not a service adviser relaying messages.
              Same dealership-level standard. None of the overhead, none of
              the layers.
            </p>
          </Reveal>

          <Reveal
            delay={120}
            className="rounded-lg border border-border bg-surface p-8 sm:p-10"
          >
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
              Philosophy
            </p>
            <h3 className="text-2xl font-semibold tracking-tight">
              Quality over quantity
            </h3>
            <p className="mt-6 text-base leading-relaxed text-muted">
              One bike in the bay at a time, by appointment — because a
              Harley engine deserves full attention, not a shared lift. The
              goal isn&apos;t throughput. It&apos;s a bike that starts right,
              runs right, and still runs right a year from now.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
