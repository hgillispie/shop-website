import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site-config";

export function Footer({ branded = false }: { branded?: boolean }) {
  if (!branded) {
    return <LegacyFooter />;
  }

  return (
    <footer className="bg-brand-ink text-white">
      <div className="brand-checker h-3 border-y border-white/15" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:py-16">
        <div className="flex items-start gap-5">
          <Image
            src={siteConfig.logoUrl}
            alt="Swafford Speed"
            width={800}
            height={1200}
            className="h-24 w-auto object-contain"
            sizes="64px"
          />
          <div className="pt-2">
            <p className="font-display text-2xl uppercase tracking-wide">
              Built around the bike.
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">
              Harley-Davidson performance, service, restoration, and custom builds in Upstate South Carolina.
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange">Get in touch</p>
          <a
            href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
            className="mt-4 block text-xl font-semibold text-white hover:text-brand-orange"
          >
            {siteConfig.phone}
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="mt-2 block text-sm text-white/55 hover:text-white"
          >
            {siteConfig.email}
          </a>
          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-white/40">
            By appointment only
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange">Quick links</p>
          <Link href="/#book" className="mt-1 text-white/70 hover:text-white">Request an appointment</Link>
          <Link href="/store" className="text-white/70 hover:text-white">Shop gear</Link>
          <Link href="/#services" className="text-white/70 hover:text-white">Services</Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {siteConfig.shopName}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LegacyFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface-dark py-10 text-foreground-dark">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-semibold tracking-widest uppercase">{siteConfig.shopName}</p>
          <p className="mt-1 text-xs text-muted-dark">Appointment only, {siteConfig.city}</p>
        </div>
        <div className="text-xs text-muted-dark">
          <p>{siteConfig.phone}</p>
          <p>
            <a href={`mailto:${siteConfig.email}`} className="hover:text-foreground-dark hover:underline">
              email
            </a>
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 text-xs text-muted-dark sm:items-end">
          <p>© {new Date().getFullYear()} {siteConfig.shopName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground-dark hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground-dark hover:underline">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
