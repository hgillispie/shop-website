import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/store/ProductCard";
import { getProducts } from "@/lib/shopify/storefront";

export const metadata = {
  title: "Shop",
};

export default async function StorePage() {
  // Public, customer-facing — a misconfigured/unreachable Storefront API
  // shouldn't take the whole page down. Same degrade-gracefully posture as
  // lib/email.ts/lib/sms.ts when their own creds are missing.
  const products = await getProducts().catch((error) => {
    console.error("[store] failed to load products:", error);
    return [];
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-10 flex items-end justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
          <Link href="/store/cart" className="text-sm text-muted hover:text-accent">
            View cart
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing&rsquo;s in the store yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
