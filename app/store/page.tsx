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
    <main className="mx-auto max-w-6xl px-5 pt-12 pb-24 sm:px-6">
      <p className="eyebrow text-ember">Merch</p>
      <h1 className="display-caps mt-3 mb-10 text-4xl text-bone sm:text-5xl">Shop</h1>

      {products.length === 0 ? (
        <p className="text-sm text-bone/60">
          Nothing&rsquo;s in the store yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
