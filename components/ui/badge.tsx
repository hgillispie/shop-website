import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("badge border-none", {
  variants: {
    variant: {
      accent: "badge-primary",
      outline: "badge-outline",
      muted: "badge-ghost",
    },
    size: {
      default: "h-5 min-w-5 px-1.5 text-xs",
      sm: "h-4 min-w-4 px-1 text-[10px]",
    },
  },
  defaultVariants: {
    variant: "accent",
    size: "default",
  },
});

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
