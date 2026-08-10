import { listProducts, type PrintifyProduct } from "@/lib/printify";
import { ProductCard } from "@/components/store/ProductCard";

export default async function StorePage() {
  let products: PrintifyProduct[] = [];
  let loadError = false;

  try {
    products = await listProducts();
  } catch (error) {
    console.error("[store] failed to load Printify products:", error);
    loadError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
      <p className="mt-2 text-sm text-muted">
        Shirts, flags, and stickers. Ships in a few business days.
      </p>

      {loadError && (
        <p className="mt-10 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&apos;t load the store right now. Please try again shortly.
        </p>
      )}

      {!loadError && products.length === 0 && (
        <p className="mt-10 text-sm text-muted">Nothing in the store yet — check back soon.</p>
      )}

      {products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
