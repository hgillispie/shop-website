import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { capabilities } from "@/data/services";
import { Reveal } from "@/components/Reveal";

const WORKSHOP_PHOTO =
  "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2Ff3d655989a5749679be1ebbef870d703";

export function Services() {
  return (
    <section
      id="services"
      className="scroll-mt-16 bg-ink py-20 text-bone sm:scroll-mt-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-ember">What rolls through the door</p>
          <h2 className="display-caps mt-5 text-5xl sm:text-6xl">
            Service it. Upgrade it. Make it yours.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/60">
            From maintenance and diagnostics to power, handling, rider fit, and
            full builds, every setup is planned around the bike and the way you
            ride.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability, i) => (
            <div
              key={capability.title}
              className="group relative bg-ink p-7 transition-colors hover:bg-ink-soft lg:p-8"
            >
              <span className="display-slant text-sm text-flame">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display-caps mt-4 text-2xl">{capability.title}</h3>
              <p className="mt-3.5 text-sm leading-relaxed text-bone/55">
                {capability.description}
              </p>
            </div>
          ))}
        </div>

        <Reveal className="mt-14">
          <div className="relative overflow-hidden">
            <img
              src={WORKSHOP_PHOTO}
              alt="Harley-Davidson restoration work in progress"
              className="h-[320px] w-full object-cover sm:h-[460px]"
              loading="lazy"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-7 sm:flex-row sm:items-end sm:justify-between sm:p-10">
              <p className="display-caps max-w-md text-3xl sm:text-4xl">
                Don&apos;t see your job on the list?
              </p>
              <Link
                href="#book"
                className="btn btn-primary eyebrow h-12 shrink-0 gap-2 px-7"
              >
                Start your request
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
