import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FlowStatus = "live" | "paused" | "proposed";

const STATUS_STYLES: Record<FlowStatus, string> = {
  live: "border-emerald-300 bg-emerald-50 text-emerald-800",
  paused: "border-amber-300 bg-amber-50 text-amber-800",
  proposed: "border-dashed border-zinc-300 bg-zinc-50 text-zinc-500",
};

const STATUS_LABELS: Record<FlowStatus, string> = {
  live: "Live today",
  paused: "Built, paused",
  proposed: "Proposed",
};

export type FlowStep = {
  title: string;
  detail: string;
  status: FlowStatus;
  icon: ReactNode;
};

export function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="relative">
      <div className="absolute left-6 top-6 bottom-6 w-px bg-border" aria-hidden="true" />
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-4 pl-1">
            <div
              className={cn(
                "relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 bg-background",
                step.status === "live" && "border-emerald-400 text-emerald-600",
                step.status === "paused" && "border-amber-400 text-amber-600",
                step.status === "proposed" && "border-dashed border-zinc-300 text-zinc-400",
              )}
            >
              {step.icon}
            </div>
            <div className={cn("flex-1 rounded-lg border p-4", STATUS_STYLES[step.status])}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {i + 1}. {step.title}
                </p>
                <span className="whitespace-nowrap rounded-full bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  {STATUS_LABELS[step.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
