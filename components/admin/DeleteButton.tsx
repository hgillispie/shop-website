"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteButton({
  confirmText,
  label = "Delete",
  className,
}: {
  confirmText: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-red-600 hover:text-red-700", className)}
    >
      {label}
    </button>
  );
}
