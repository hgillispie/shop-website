import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById, listProducts } from "@/lib/printify";
import { ProductDetail } from "@/components/store/ProductDetail";
import { ProductCard } from "@/components/store/ProductCard";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, allProducts] = await Promise.all([getProductById(id), listProducts()]);
  if (!product) notFound();

  // "You might also like" — everything else in the catalog, capped at 4 so
  // the grid stays tidy. listProducts() is already cached, so this piggybacks
  // on the same fetch getProductById just made rather than costing extra.
  const related = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/store" className="text-xs text-muted hover:text-accent">
        ← All products
      </Link>

      <ProductDetail product={product} />

      {related.length > 0 && (
        <div className="mt-20 border-t border-border pt-10">
          <h2 className="text-lg font-semibold tracking-tight">You might also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
