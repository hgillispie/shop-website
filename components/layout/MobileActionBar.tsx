import Link from "next/link";
import { Phone } from "lucide-react";
import { siteConfig } from "@/data/site-config";

const BAR_H = "calc(53px + env(safe-area-inset-bottom))";

export function MobileActionBar() {
  return (
    <>
      {/* The bar is fixed, so the page needs matching flow space or it clips
          the end of the footer. */}
      <div aria-hidden="true" className="md:hidden" style={{ height: BAR_H }} />

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px border-t border-hairline bg-ink-deep pb-[env(safe-area-inset-bottom)] md:hidden">
        <a
          href={siteConfig.phoneHref}
          className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-bone"
        >
          <Phone className="h-4 w-4 text-flame" aria-hidden="true" />
          Call the shop
        </a>
        <Link
          href="/#book"
          className="eyebrow flex items-center justify-center bg-flame py-4 text-ink"
        >
          Book a slot
        </Link>
      </div>
    </>
  );
}
