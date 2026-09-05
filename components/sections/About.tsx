import { Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { shopPhotos } from "@/data/photos";

const POINTS = [
  "Power, suspension, brakes, and controls planned as a complete setup",
  "Modern Twin Cam and Milwaukee-Eight performance expertise",
  "Vintage restoration, fabrication, and full custom builds",
];

export function About() {
  return (
    <section
      id="about"
      className="scroll-mt-(--header-h) bg-bone py-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <Reveal className="relative">
          <img
            src={shopPhotos.aboutPrimary.src}
            alt={shopPhotos.aboutPrimary.alt}
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
          <p className="eyebrow text-flame-deep">Why Swafford Speed</p>
          <h2 className="display-caps mt-5 text-5xl text-ink sm:text-6xl">
            Built for riders who want more than stock.
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink/70">
            Most bikes we see don&apos;t need one part — they need a plan.
          </p>

          <ul className="mt-8 space-y-4 border-y border-ink/15 py-6 text-sm text-ink/75">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-flame-deep"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>

          <blockquote className="mt-9 border-l-3 border-flame pl-6">
            <p className="display-slant text-3xl text-ink sm:text-4xl">
              Quality over quantity
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-ink/70">
              The goal was never throughput. It&apos;s a bike that starts right,
              runs right, and stays that way.
            </p>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
