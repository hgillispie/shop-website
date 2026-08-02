"use client";

import { useState } from "react";
import { BikeIllustration } from "@/components/projects/BikeIllustration";
import { cn } from "@/lib/utils";
import type { Project } from "@/data/projects";

export function BeforeAfterToggle({ project }: { project: Project }) {
  const [tone, setTone] = useState<"before" | "after">("before");
  const image = tone === "before" ? project.beforeImage : project.afterImage;

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border">
        {image ? (
          <img
            src={image}
            alt={`${project.title} — ${tone}`}
            className="h-56 w-full object-cover sm:h-64"
          />
        ) : (
          <BikeIllustration
            variant={project.imageVariant}
            tone={tone}
            className="h-56 w-full sm:h-64"
          />
        )}
      </div>

      <div className="mt-3 inline-flex rounded-full border border-border p-1 text-xs font-medium">
        {(["before", "after"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTone(option)}
            aria-pressed={tone === option}
            className={cn(
              "rounded-full px-4 py-1.5 capitalize transition-colors",
              tone === option
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
