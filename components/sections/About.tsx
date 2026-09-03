import { siteConfig } from "@/data/site-config";
import { Reveal } from "@/components/Reveal";

const SHOP_PHOTO =
  "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Fcee12a5000a24d0292047a9e0e8181c1";

export function About() {
  return (
    <section
      id="about"
      className="scroll-mt-(--header-h) bg-bone py-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <Reveal className="relative">
          <img
            src={SHOP_PHOTO}
            alt="Inside the Swafford Speed shop"
            className="aspect-4/5 w-full object-cover"
            loading="lazy"
          />
          <div
            className="checkers absolute -bottom-4 -right-4 h-24 w-24"
            style={
              {
                "--checker-color": "var(--ink)",
                "--checker-size": "16px",
              } as React.CSSProperties
            }
            aria-hidden="true"
          />
        </Reveal>

        <Reveal delay={100}>
          <p className="eyebrow text-flame">Who works on your bike</p>
          <h2 className="display-caps mt-5 text-5xl text-ink sm:text-6xl">
            Dealership-trained.
            <br />
            Independently run.
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink/70">
            20 years of experience working and running Harley-Davidson service
            departments. At {siteConfig.shopName} you can expect the same
            standard of work without the overhead of a big-box floor.
          </p>

          <blockquote className="mt-9 border-l-3 border-flame pl-6">
            <p className="display-slant text-3xl text-ink sm:text-4xl">
              Quality over quantity
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-ink/70">
              This shop takes one bike at a time, by appointment, so every job
              gets the attention a dealership schedule rarely allows. The goal
              isn&apos;t throughput — it&apos;s a bike that starts right, runs
              right, and stays that way.
            </p>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
