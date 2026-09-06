import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/** Shop photography under `public/photos/` — no Builder CDN.
 *  About uses only the single chopper file. Do not reference
 *  shop-choppers-2.jpg or shop-choppers-3.jpg. */
export const shopPhotos = {
  hero: {
    src: "/photos/bagger-front.jpg",
    alt: "Custom Harley Road Glide outside Swafford Speed",
  },
  aboutHeader: {
    src: "/photos/bagger-side.jpg",
    alt: "Side profile of a custom orange and black Harley-Davidson CVO Road Glide at Swafford Speed",
  },
  aboutPrimary: {
    src: "/photos/shop-choppers-1.jpg",
    alt: "Custom Harleys in the Swafford Speed shop",
  },
} as const;

function listPublicPhotos(): Set<string> {
  const dir = path.join(process.cwd(), "public", "photos");
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir).filter((name) => /\.(jpe?g|webp|png)$/i.test(name)),
  );
}

const present = listPublicPhotos();

export function hasPublicPhoto(src: string): boolean {
  const name = src.split("/").pop() ?? "";
  return present.has(name);
}
