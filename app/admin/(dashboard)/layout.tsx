import Link from "next/link";
import type { Metadata } from "next";
import { logout } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";
import { NavDropdown } from "@/components/admin/NavDropdown";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Grouped behind one "Overview" trigger (see NavDropdown) — these three are
// the "keep an eye on things" tabs, as opposed to the hands-on tools below.
// Rename the label freely; it's just a string.
const OVERVIEW_LINKS = [
  { label: "Requests", href: "/admin/requests" },
  { label: "Calendar", href: "/admin/calendar" },
  { label: "Analytics", href: "/admin/analytics" },
];

// "Orders" and "Terminal" removed here as part of the Shopify migration
// (see docs/shopify-migration-plan.md) — merch orders live in Shopify's own
// admin now, and in-person payments move to the native Shopify POS app, no
// custom UI to link to.
const NAV_LINKS = [
  { label: "Board", href: "/admin/board" },
  { label: "Customers", href: "/admin/crm" },
  { label: "Invoices", href: "/admin/invoices" },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold tracking-widest uppercase">
              Shop Admin
            </span>
            <nav className="flex items-center gap-6">
              <NavDropdown label="Overview" links={OVERVIEW_LINKS} />
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-foreground/80 transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            {session?.email}
            <form action={logout}>
              <button type="submit" className="text-accent hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
