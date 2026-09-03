import { getProducts } from "@/lib/shopify/storefront";
import type { Product } from "@/lib/shopify/types";

// Printify/Shopify handles drift from titles ("Evo Tee" ships as
// `evo-pocket-tee`), so match on every token appearing somewhere rather than
// on an exact string.
function pick(products: Product[], needle: string): Product | null {
  const n = needle.toLowerCase();
  const exact = products.find((p) => p.handle.toLowerCase() === n);
  if (exact) return exact;

  const tokens = n.split(/[-\s]+/).filter(Boolean);
  return (
    products.find((p) => {
      const haystack = `${p.handle} ${p.title}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    }) ?? null
  );
}

export type FeaturedProducts = {
  hero: Product | null;
  banner: Product | null;
  all: Product[];
};

// One fetch feeds the hero, the banner and the store strip. A Shopify outage
// degrades every one of them to a designed fallback instead of a blank gap.
export async function getFeatured(handles: {
  hero: string;
  banner: string;
}): Promise<FeaturedProducts> {
  const all = await getProducts({ first: 24 }).catch((error) => {
    console.error("[landing] failed to load products:", error);
    return [] as Product[];
  });

  const hero = pick(all, handles.hero);
  const banner = pick(all, handles.banner);

  return {
    hero,
    banner,
    // Don't repeat the two products that already have their own slot.
    all: all.filter((p) => p !== hero && p !== banner),
  };
}
