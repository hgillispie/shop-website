import { cn } from "@/lib/utils";

const REQUEST_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
};

const JOB_STYLES: Record<string, string> = {
  backlog: "bg-zinc-100 text-zinc-700",
  in_progress: "bg-blue-100 text-blue-800",
  waiting_on_customer: "bg-amber-100 text-amber-800",
  complete: "bg-emerald-100 text-emerald-800",
};

const LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  backlog: "Backlog",
  in_progress: "In Progress",
  waiting_on_customer: "Waiting on Customer",
  complete: "Complete",
};

export function StatusBadge({ status }: { status: string }) {
  const style = REQUEST_STYLES[status] ?? JOB_STYLES[status] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        style,
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
