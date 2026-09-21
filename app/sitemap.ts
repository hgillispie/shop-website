import type { MetadataRoute } from "next";
import { getProductSitemapEntries } from "@/lib/shopify/storefront";
import { canonicalUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: canonicalUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: canonicalUrl("/store"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: canonicalUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: canonicalUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: canonicalUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const products = await getProductSitemapEntries().catch((error) => {
    console.error("[sitemap] failed to load products:", error);
    return [];
  });

  for (const product of products) {
    entries.push({
      url: canonicalUrl(`/store/products/${product.handle}`),
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
