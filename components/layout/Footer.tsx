import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import { LogoMark } from "@/components/brand/Logo";
import { TrackedLink } from "@/components/TrackedLink";

const QUICK_LINKS = [
  { label: "Request an appointment", href: "/#book" },
  { label: "Shop gear", href: "/store" },
  { label: "Services", href: "/#services" },
];

export function Footer() {
  return (
    <footer className="bg-ink-deep text-bone">
      <div
        className="checkers h-3 opacity-30"
        style={
          {
            "--checker-color": "var(--bone)",
            "--checker-size": "12px",
          } as React.CSSProperties
        }
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:py-16">
        <div className="flex items-start gap-5">
          <LogoMark className="h-24" />
          <div className="pt-1">
            <p className="display-caps text-2xl">Built around the bike.</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-bone/60">
              Harley-Davidson performance, service, restoration, and custom
              builds in Upstate South Carolina.
            </p>
          </div>
        </div>

        <div>
          <p className="eyebrow text-ember">Get in touch</p>
          <TrackedLink
            href={siteConfig.phoneHref}
            event="call_click"
            meta={{ location: "footer" }}
            className="mt-4 block text-xl font-semibold text-bone transition-colors hover:text-ember"
          >
            {siteConfig.phone}
          </TrackedLink>
          <a
            href={`mailto:${siteConfig.email}`}
            className="mt-2 block text-sm text-bone/60 transition-colors hover:text-bone"
          >
            {siteConfig.email}
          </a>
          <p className="eyebrow mt-5 text-bone/60">By appointment only</p>
          <p className="mt-2 text-sm text-bone/60">{siteConfig.city}</p>
        </div>

        <nav aria-label="Footer">
          <p className="eyebrow text-ember">Quick links</p>
          <ul className="mt-4 space-y-3">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-bone/70 transition-colors hover:text-bone"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-bone/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {siteConfig.shopName}. All rights
            reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-bone">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-bone">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
