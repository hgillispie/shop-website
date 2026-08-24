import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Placeholder for the duration of the Shopify migration (see
// docs/shopify-migration-plan.md) — the old Stripe/Printify-direct
// storefront was removed on this branch; the Shopify Storefront API +
// Cart API version replacing it needs a real store domain and Storefront
// API token before it can be built and verified, neither of which exist
// yet. Keeping a real (if minimal) page here rather than leaving /store
// to 404, since the Navbar's "Store" link still points here.
export default function StorePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
        <p className="mt-4 text-sm text-muted">
          The store is being rebuilt on Shopify — check back soon.
        </p>
      </main>
      <Footer />
    </>
  );
}
