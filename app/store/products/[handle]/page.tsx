import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/store/AddToCartForm";
import { ProductDetails } from "@/components/store/ProductDetails";
import { ProductGallery } from "@/components/store/ProductGallery";
import { getProductByHandle } from "@/lib/shopify/storefront";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle).catch((error) => {
    console.error("[store] failed to load product:", handle, error);
    return null;
  });

  if (!product) notFound();

  return (
    <main className="mx-auto max-w-5xl px-5 pt-12 pb-24 sm:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-6">
          <div>
            <p className="eyebrow text-ember">Shop</p>
            <h1 className="display-caps mt-3 text-3xl text-bone sm:text-4xl">
              {product.title}
            </h1>
          </div>

          <AddToCartForm product={product} />
          <ProductDetails description={product.description} />
        </div>
      </div>
    </main>
  );
}
