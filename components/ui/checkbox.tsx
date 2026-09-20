import * as React from "react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        // Unchecked must keep a real 2px ink outline. DaisyUI's `.checkbox`
        // border shorthand uses `--border` as a *width*, but :root --border
        // here is a color, so the native daisy border is invalid/invisible
        // on light admin surfaces.
        "checkbox checkbox-primary checkbox-sm border-2 border-solid border-ink/55 bg-white",
        "checked:border-flame checked:bg-flame",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-deep",
        className,
      )}
      {...props}
    />
  );
});
