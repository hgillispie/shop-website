import { Phone } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { IntakeForm } from "@/components/booking/IntakeForm";
import { TrackedLink } from "@/components/TrackedLink";

export function Booking() {
  return (
    <section
      id="book"
      className="scroll-mt-(--header-h) bg-ink px-5 py-16 text-bone sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="display-caps text-4xl sm:text-5xl">Request a spot</h2>
          <TrackedLink
            href={siteConfig.phoneHref}
            event="call_click"
            meta={{ location: "booking" }}
            className="inline-flex items-center gap-2 text-base font-semibold text-bone transition-colors hover:text-ember"
          >
            <Phone className="h-4 w-4 text-flame" aria-hidden="true" />
            {siteConfig.phone}
          </TrackedLink>
        </div>

        <div className="mt-7 bg-bone p-6 sm:p-8">
          <IntakeForm />
        </div>
      </div>
    </section>
  );
}
