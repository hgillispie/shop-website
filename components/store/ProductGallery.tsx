"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PrintifyImage } from "@/lib/printify";
import { cn } from "@/lib/utils";

/**
 * The main product photo plus its front/back/detail shots — arrows on
 * either side of the main image cycle through this ONE product's own
 * images (not between different products; that's a separate "You might
 * also like" section instead). Thumbnails below double as direct jumps to
 * a given photo, and stay in sync with whichever one the arrows land on.
 */
export function ProductGallery({
  images,
  title,
}: {
  images: PrintifyImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-square rounded-lg border border-border bg-surface" />;
  }

  const active = images[activeIndex];

  function showPrevious() {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }
  function showNext() {
    setActiveIndex((i) => (i + 1) % images.length);
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface">
        <img src={active.src} alt={title} className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-pressed={i === activeIndex}
              className={cn(
                "aspect-square overflow-hidden rounded-md border-2 bg-surface transition-colors",
                i === activeIndex ? "border-accent" : "border-border hover:border-foreground/40",
              )}
            >
              <img src={img.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
