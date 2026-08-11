import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProductById, listProducts } from "@/lib/printify";
import { AddToCartForm } from "@/components/store/AddToCartForm";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, allProducts] = await Promise.all([getProductById(id), listProducts()]);
  if (!product) notFound();

  const images = product.images.length > 0 ? product.images : [];

  // Lets someone flip through the whole catalog from a product page rather
  // than bouncing back to the grid after every item — listProducts() is
  // cached, so this costs nothing extra over what getProductById already did.
  const index = allProducts.findIndex((p) => p.id === product.id);
  const previous = index > 0 ? allProducts[index - 1] : null;
  const next = index !== -1 && index < allProducts.length - 1 ? allProducts[index + 1] : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/store" className="text-xs text-muted hover:text-accent">
          ← All products
        </Link>
        {(previous || next) && (
          <div className="flex min-w-0 items-center gap-3 text-xs text-muted">
            {previous ? (
              <Link
                href={`/store/products/${previous.id}`}
                className="flex min-w-0 items-center gap-1 hover:text-accent"
              >
                <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden max-w-[10rem] truncate sm:inline">
                  {previous.title}
                </span>
              </Link>
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 text-border" aria-hidden="true" />
            )}
            <span className="text-border">·</span>
            {next ? (
              <Link
                href={`/store/products/${next.id}`}
                className="flex min-w-0 items-center gap-1 hover:text-accent"
              >
                <span className="hidden max-w-[10rem] truncate sm:inline">{next.title}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </Link>
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-border" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

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
            <div
              className="mt-4 space-y-3 text-sm leading-relaxed text-muted [&_p]:mt-0"
              // Printify product descriptions are HTML (already wrapped in
              // their own <p> tags) — a <div> wrapper here, not <p>, since
              // nesting <p> inside <p> is invalid HTML and gets silently
              // restructured differently by the browser's parser between
              // the initial SSR pass and hydration, causing a mismatch.
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
