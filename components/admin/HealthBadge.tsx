import { cn } from "@/lib/utils";

export function HealthBadge({ score }: { score: number | null | undefined }) {
  if (score == null) {
    return <span className="text-xs text-muted">—</span>;
  }

  const tone =
    score >= 80
      ? "bg-emerald-100 text-emerald-800"
      : score >= 65
        ? "bg-amber-100 text-amber-800"
        : "bg-zinc-100 text-zinc-700";

  return (
    <span
      className={cn(
        "inline-flex min-w-10 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
        tone,
      )}
      title="Customer health — completed work, conversation tone, and their own words"
    >
      {score}
    </span>
  );
}
