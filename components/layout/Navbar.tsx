"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="text-sm font-semibold tracking-widest uppercase">
          {siteConfig.shopName}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {siteConfig.navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-foreground/80 transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <ButtonLink href="#book" size="sm" className="hidden md:inline-flex">
          Request an Appointment
        </ButtonLink>

        <button
          type="button"
          aria-label="Toggle menu"
          className="text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
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
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="py-4">
            <a
              href="#book"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Request an Appointment
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
