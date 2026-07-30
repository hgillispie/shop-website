import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Service = {
  name: string;
  detail: string;
  status: "live" | "paused" | "proposed";
};

type Zone = {
  title: string;
  icon: ReactNode;
  services: Service[];
};

const BADGE_STYLES: Record<Service["status"], string> = {
  live: "",
  paused: "bg-amber-100 text-amber-700",
  proposed: "bg-zinc-100 text-zinc-500",
};

const BADGE_LABELS: Record<Service["status"], string> = {
  live: "",
  paused: "Built, paused",
  proposed: "Proposed",
};

function ServiceCard({ service }: { service: Service }) {
  return (
    <div
      className={cn(
        "rounded-md border bg-background p-3",
        service.status === "proposed"
          ? "border-dashed border-zinc-300 opacity-70"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{service.name}</p>
        {service.status !== "live" && (
          <span
            className={cn(
              "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
              BADGE_STYLES[service.status],
            )}
          >
            {BADGE_LABELS[service.status]}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">{service.detail}</p>
    </div>
  );
}

export function ArchitectureDiagram({ zones }: { zones: Zone[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {zones.map((zone) => (
        <div key={zone.title} className="rounded-lg border border-dashed border-border p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {zone.icon}
            {zone.title}
          </div>
          <div className="mt-3 space-y-2">
            {zone.services.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
