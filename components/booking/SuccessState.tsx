import { CalendarCheck } from "lucide-react";

export function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-8 text-center sm:p-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <CalendarCheck className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">
        Request received.
      </h3>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
        This shop is <span className="font-medium text-foreground">appointment only</span>.
        Your request goes straight to the shop — once your appointment slot
        is approved, you&apos;ll receive a text confirmation with the shop&apos;s
        address and drop-off time.
      </p>
      <p className="mx-auto mt-3 max-w-md text-xs text-muted">
        No appointment is scheduled yet. If anything urgent comes up, keep an
        eye on your phone for a call or text back.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 text-xs font-medium uppercase tracking-wide text-accent hover:underline"
      >
        Submit another request
      </button>
    </div>
  );
}
