import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/store/AddToCartForm";
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

  const [primaryImage, ...restImages] = product.images;

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-24">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-surface">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.altText ?? product.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          {restImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {restImages.map((image) => (
                <div
                  key={image.url}
                  className="aspect-square overflow-hidden rounded-lg bg-surface"
                >
                  <img
                    src={image.url}
                    alt={image.altText ?? product.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

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
