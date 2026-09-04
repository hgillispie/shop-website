"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/shopify/types";

// Shared between the product detail page and QuickViewModal — same
// click-a-thumbnail-to-swap-the-main-image behavior in both places, one
// implementation. Previously the thumbnails on the product page were
// static <img> tags with no click handler at all.
export function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  const active = images[selected] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden bg-ink-soft">
        {active ? (
          <img
            src={active.url}
            alt={active.altText ?? title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === selected}
              className={cn(
                "aspect-square overflow-hidden bg-ink-soft ring-2 ring-offset-2 ring-offset-ink transition-colors",
                i === selected ? "ring-ember" : "ring-transparent hover:ring-hairline",
              )}
            >
              <img
                src={image.url}
                alt={image.altText ?? title}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
