"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || open
          ? "bg-ink/95 backdrop-blur-md"
          : "bg-gradient-to-b from-ink/85 to-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:h-20 sm:px-6">
        <Link href="/#top" aria-label={siteConfig.shopName} className="shrink-0">
          <Logo markClassName="h-9 sm:h-11" priority />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {siteConfig.navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="eyebrow text-bone/70 transition-colors hover:text-ember"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={siteConfig.phoneHref}
            className="flex items-center gap-2 text-sm font-semibold text-bone transition-colors hover:text-ember"
          >
            <Phone className="h-4 w-4 text-flame" aria-hidden="true" />
            {siteConfig.phone}
          </a>
          <Link href="/#book" className="btn btn-primary eyebrow h-11 px-6">
            Book a slot
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="text-bone md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <div
        className={cn(
          "grid overflow-hidden bg-ink/95 backdrop-blur-md transition-[grid-template-rows] duration-300 md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <ul className="overflow-hidden px-5">
          {siteConfig.navLinks.map((link) => (
            <li key={link.href} className="border-b border-hairline">
              <Link
                href={link.href}
                className="display-caps block py-4 text-2xl text-bone"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="flex flex-col gap-3 py-5">
            <Link
              href="/#book"
              className="btn btn-primary btn-block eyebrow"
              onClick={() => setOpen(false)}
            >
              Request an appointment
            </Link>
            <a
              href={siteConfig.phoneHref}
              className="btn btn-outline btn-block eyebrow border-hairline text-bone hover:border-ember hover:bg-transparent hover:text-ember"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {siteConfig.phone}
            </a>
          </li>
        </ul>
      </div>

      <div
        className="checkers h-1.5 w-full opacity-80"
        style={
          {
            "--checker-color": "var(--flame)",
            "--checker-size": "12px",
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
    </header>
  );
}
