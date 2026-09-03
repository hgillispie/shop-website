import { Phone } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { TrackedLink } from "@/components/TrackedLink";

const BAR_H = "calc(53px + env(safe-area-inset-bottom))";

export function MobileActionBar() {
  return (
    <>
      {/* The bar is fixed, so the page needs matching flow space or it clips
          the end of the footer. */}
      <div aria-hidden="true" className="md:hidden" style={{ height: BAR_H }} />

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px border-t border-hairline bg-ink-deep pb-[env(safe-area-inset-bottom)] md:hidden">
        <TrackedLink
          href={siteConfig.phoneHref}
          event="call_click"
          meta={{ location: "mobile_bar" }}
          className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-bone"
        >
          <Phone className="h-4 w-4 text-flame" aria-hidden="true" />
          Call the shop
        </TrackedLink>
        <TrackedLink
          href="/#book"
          event="booking_start"
          meta={{ entry: "mobile_bar" }}
          className="eyebrow flex items-center justify-center bg-flame py-4 text-ink"
        >
          Book a slot
        </TrackedLink>
      </div>
    </>
  );
}
