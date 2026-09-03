import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="bg-ink-deep py-16 text-bone">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo markClassName="h-12" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-bone/50">
              {siteConfig.tagline} By appointment only, {siteConfig.city}.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="eyebrow text-bone/60">Site</p>
            <ul className="mt-5 space-y-3">
              {siteConfig.navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-bone/70 transition-colors hover:text-ember"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow text-bone/60">Contact</p>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={siteConfig.phoneHref}
                  className="flex items-center gap-2.5 text-sm text-bone/70 transition-colors hover:text-ember"
                >
                  <Phone className="h-4 w-4 text-flame" aria-hidden="true" />
                  {siteConfig.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-2.5 text-sm text-bone/70 transition-colors hover:text-ember"
                >
                  <Mail className="h-4 w-4 text-flame" aria-hidden="true" />
                  Email the shop
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="checkers mt-14 h-2 opacity-25"
          style={
            {
              "--checker-color": "var(--bone)",
              "--checker-size": "10px",
            } as React.CSSProperties
          }
          aria-hidden="true"
        />

        <div className="mt-6 flex flex-col gap-3 text-xs text-bone/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.shopName}. All rights
            reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-bone">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-bone">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
