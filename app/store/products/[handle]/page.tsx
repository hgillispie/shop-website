import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/store/AddToCartForm";
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
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-24">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
            {product.description ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">{product.description}</p>
            ) : null}
          </div>

          <AddToCartForm product={product} />
        </div>
      </div>
    </main>
  );
}
