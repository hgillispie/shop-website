import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/store/CartProvider";
import { CartLink } from "@/components/store/CartLink";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `Store | ${siteConfig.shopName}`,
  description: `Shirts, flags, and stickers from ${siteConfig.shopName}.`,
};

// A genuinely separate app section — product grid, cart, checkout — rather
// than another scroll-anchored section of the marketing page. Still shares
// Navbar/Footer and the site's design system so it reads as part of the
// same site.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      <div className="pt-16">
        <div className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/store"
              className="text-sm font-semibold uppercase tracking-widest text-foreground"
            >
              Store
            </Link>
            <CartLink />
          </div>
        </div>
        <main className="min-h-[60vh] bg-background">{children}</main>
      </div>
      <Footer />
    </CartProvider>
  );
}
