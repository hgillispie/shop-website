import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById } from "@/lib/printify";
import { AddToCartForm } from "@/components/store/AddToCartForm";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const images = product.images.length > 0 ? product.images : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/store" className="text-xs text-muted hover:text-accent">
        ← All products
      </Link>

      <div className="mt-4 grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-border bg-surface">
            {images[0] && (
              <img
                src={images[0].src}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img) => (
                <div
                  key={img.src}
                  className="aspect-square overflow-hidden rounded-md border border-border bg-surface"
                >
                  <img src={img.src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
          {product.description && (
            <p
              className="mt-4 text-sm leading-relaxed text-muted"
              // Printify product descriptions are HTML — matches how Printify's
              // own dashboard renders them.
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          <div className="mt-8">
            <AddToCartForm product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
