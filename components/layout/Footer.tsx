import Link from "next/link";
import { siteConfig } from "@/data/site-config";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface-dark py-10 text-foreground-dark">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-semibold tracking-widest uppercase">
            {siteConfig.shopName}
          </p>
          <p className="mt-1 text-xs text-muted-dark">
            Appointment only — {siteConfig.city}
          </p>
        </div>
        <div className="text-xs text-muted-dark">
          <p>{siteConfig.phone}</p>
          <p>{siteConfig.email}</p>
        </div>
        <div className="flex flex-col items-center gap-2 text-xs text-muted-dark sm:items-end">
          <p>
            © {new Date().getFullYear()} {siteConfig.shopName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground-dark hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground-dark hover:underline">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
