import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/store/AddToCartForm";
import { ProductDetails } from "@/components/store/ProductDetails";
import { ProductGallery } from "@/components/store/ProductGallery";
import { siteConfig } from "@/data/site-config";
import { getProductByHandle } from "@/lib/shopify/storefront";

function truncatePlainText(text: string, maxLength = 160): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const slice = normalized.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const clipped = (lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trimEnd();
  return `${clipped}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle).catch((error) => {
    console.error("[store] failed to load product metadata:", handle, error);
    return null;
  });

  if (!product) {
    return { title: `Shop | ${siteConfig.shopName}` };
  }

  const title = `${product.title} | ${siteConfig.shopName}`;
  const description =
    truncatePlainText(product.description) ||
    `${product.title} from ${siteConfig.shopName} — Harley-Davidson performance merch from the shop in ${siteConfig.city}.`;
  const image = product.images[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/store/products/${product.handle}`,
      siteName: siteConfig.shopName,
      locale: "en_US",
      type: "website",
      images: image
        ? [{ url: image.url, alt: image.altText ?? product.title }]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image.url] : undefined,
    },
  };
}

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
