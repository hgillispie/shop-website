import { Phone } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { IntakeForm } from "@/components/booking/IntakeForm";
import { Reveal } from "@/components/Reveal";
import { TrackedLink } from "@/components/TrackedLink";

const NEXT_STEPS = [
  {
    title: "Send the details",
    body: "The bike, what you want to fix or change, and how to reach you. About a minute.",
  },
  {
    title: "Reviewed personally",
    body: "It goes to the person who'll actually be doing the work.",
  },
  {
    title: "Slot confirmed",
    body: "Once your appointment is approved you'll get the shop address and a drop-off time.",
  },
];

export function Booking() {
  return (
    <section
      id="book"
      className="scroll-mt-16 bg-ink py-20 text-bone sm:scroll-mt-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow text-ember">Start here</p>
          <h2 className="display-caps mt-5 text-5xl sm:text-6xl">
            Request
            <br />
            a spot
          </h2>
          <p className="mt-6 leading-relaxed text-bone/60">
            Tell us what needs attention or what you want to improve. Nothing
            gets scheduled until you know the scope and what it&apos;ll run.
          </p>

          <ol className="mt-10 space-y-7">
            {NEXT_STEPS.map((item, i) => (
              <li key={item.title} className="flex gap-5">
                <span className="display-slant mt-0.5 shrink-0 text-lg text-flame">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="display-caps text-xl">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-bone/50">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 border-t border-hairline pt-7">
            <p className="text-sm text-bone/50">Rather just talk it through?</p>
            <TrackedLink
              href={siteConfig.phoneHref}
              event="call_click"
              meta={{ location: "booking" }}
              className="mt-2.5 inline-flex items-center gap-2.5 text-xl font-semibold text-bone transition-colors hover:text-ember"
            >
              <Phone className="h-5 w-5 text-flame" aria-hidden="true" />
              {siteConfig.phone}
            </TrackedLink>
          </div>
        </Reveal>

        <div className="bg-bone p-6 sm:p-10">
          <IntakeForm />
        </div>
      </div>
    </section>
  );
}
