"use client";

import { useState } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/data/site-config";
import { cn } from "@/lib/utils";

export function Navbar({ branded = false }: { branded?: boolean }) {
  return branded ? <BrandedNavbar /> : <LegacyNavbar />;
}

function BrandedNavbar() {
  const links = [
    { label: "Services", href: "/#services" },
    { label: "Why Swafford", href: "/#about" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <Disclosure
      as="header"
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand-ink/95 text-white backdrop-blur-md"
    >
      {({ open, close }) => (
        <>
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/#top"
              aria-label="Swafford Speed home"
              className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"
            >
              <Image
                src={siteConfig.logoUrl}
                alt="Swafford Speed"
                width={800}
                height={1200}
                className="h-16 w-auto object-contain"
                sizes="48px"
                preload
              />
              <span className="hidden border-l border-white/20 pl-3 text-[10px] font-semibold uppercase leading-4 tracking-[0.2em] text-white/65 sm:block">
                Upstate, South Carolina
              </span>
            </Link>

            <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/store"
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Shop gear
              </Link>
              <Link
                href="/#book"
                className="bg-brand-orange px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Request appointment
              </Link>
            </nav>

            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/#book"
                className="bg-brand-orange px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-ink"
              >
                Book
              </Link>
              <DisclosureButton
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                className="grid h-10 w-10 place-items-center border border-white/20 text-white focus-visible:outline-2 focus-visible:outline-brand-orange"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </DisclosureButton>
            </div>
          </div>

          <DisclosurePanel
            transition
            className="origin-top border-t border-white/10 bg-brand-ink px-5 pb-6 pt-2 transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0 lg:hidden"
          >
            <nav aria-label="Mobile navigation" className="mx-auto max-w-7xl">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => close()}
                  className="block border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/80"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/store"
                onClick={() => close()}
                className="flex items-center gap-2 border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-orange"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Shop Swafford gear
              </Link>
              <a
                href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
                className="mt-5 block text-sm text-white/65"
              >
                Prefer to call? <span className="font-semibold text-white">{siteConfig.phone}</span>
              </a>
            </nav>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

function LegacyNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-border/60 backdrop-blur-md"
      style={{ backgroundColor: "#b3812f" }}
    >
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between border px-6 [border-style:groove]"
        style={{ color: "#232e37", backgroundColor: "rgba(0, 0, 0, 1)" }}
      >
        <Link
          href="/#top"
          className="text-left text-xl font-semibold italic tracking-widest uppercase"
          style={{
            fontFamily: "var(--font-big-shoulders-stencil-text), display",
            WebkitTextStroke: "0.5px currentColor",
            color: "#b3812f",
          }}
        >
          {siteConfig.shopName}
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {siteConfig.navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-foreground/80 transition-colors hover:text-accent"
                style={{ color: "#b3812f" }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <ButtonLink href="/#book" size="sm" className="hidden md:inline-flex">
          Request an Appointment
        </ButtonLink>

        <button
          type="button"
          aria-label="Toggle menu"
          className="text-foreground md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <div
        className={cn(
          "grid overflow-hidden border-t border-border/60 bg-background transition-[grid-template-rows] duration-300 md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <ul className="overflow-hidden px-6">
          {siteConfig.navLinks.map((link) => (
            <li key={link.href} className="border-b border-border/40 py-3">
              <a
                href={link.href}
                className="text-sm text-foreground/80"
                style={{ color: "#b3812f" }}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="py-4">
            <Link
              href="/#book"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Request an Appointment
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
