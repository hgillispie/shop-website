import { Check, Loader2 } from "lucide-react";
import { formatCents } from "@/lib/store/money";
import { cn } from "@/lib/utils";

// A skeuomorphic mockup of what a customer sees on the physical S700's own
// screen — for demoing the concept before the real device/full Stripe
// account exist. Deliberately just a visual layer: every stage below maps
// directly off TerminalCheckout's real chargeStatus state machine (already
// driving Stripe's simulated reader), not a separate fake state of its
// own — what's shown here is what the real (simulated) flow is actually
// doing, not a decoupled animation. See TerminalCheckout.tsx for the
// mapping.
export type ReaderScreenStage =
  | "idle"
  | "ready"
  | "connecting"
  | "present-card"
  | "processing"
  | "approved";

const STAGE_COPY: Record<ReaderScreenStage, string> = {
  idle: "Ready",
  ready: "Ready to charge",
  connecting: "Connecting…",
  "present-card": "Insert, tap, or swipe",
  processing: "Processing…",
  approved: "Approved",
};

function ContactlessGlyph({ className }: { className?: string }) {
  // A minimal, universally-recognized contactless-payment mark — three
  // concentric arcs — kept deliberately simple rather than a detailed icon.
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 8.5a6.5 6.5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.3 6a10 10 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M13.6 3.5a13.5 13.5 0 0 1 0 17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TerminalScreenPreview({
  stage,
  amountCents,
  lineLabel,
  receiptEmail,
}: {
  stage: ReaderScreenStage;
  amountCents: number;
  lineLabel?: string;
  receiptEmail?: string;
}) {
  const showAmount = stage !== "idle";

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        What the customer sees on the reader
      </p>
      <p className="mt-1 text-xs text-muted">
        A mockup for demo purposes — the real S700 isn&apos;t connected yet, so this reflects
        the same (simulated) transaction state shown above, just as the customer would see it.
      </p>

      {/* Bezel */}
      <div className="mx-auto mt-4 w-56 rounded-[2rem] bg-neutral-900 p-3 shadow-xl">
        <div className="flex justify-center pb-2">
          <div className="h-1 w-10 rounded-full bg-neutral-700" />
        </div>

        {/* Screen */}
        <div className="flex aspect-[9/16] flex-col rounded-2xl bg-white px-5 py-6 text-center">
          <div className="flex items-center justify-between text-[9px] text-neutral-400">
            <span className="font-mono uppercase tracking-wide">Swafford Speed</span>
            <span aria-hidden="true">●●●</span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            {showAmount ? (
              <>
                <p className="font-mono text-3xl font-bold tabular-nums text-neutral-900">
                  {formatCents(amountCents)}
                </p>
                {lineLabel && (
                  <p className="line-clamp-2 px-2 text-xs text-neutral-500">{lineLabel}</p>
                )}
              </>
            ) : (
              <p className="font-mono text-sm text-neutral-400">Swafford Speed</p>
            )}

            <div className="mt-1 flex flex-col items-center gap-2">
              {stage === "connecting" && (
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" aria-hidden="true" />
              )}
              {stage === "present-card" && (
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30" />
                  <ContactlessGlyph className="relative h-7 w-7 text-accent" />
                </div>
              )}
              {stage === "processing" && (
                <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
              )}
              {stage === "approved" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                </div>
              )}

              <p
                className={cn(
                  "text-sm font-medium",
                  stage === "approved" ? "text-emerald-700" : "text-neutral-700",
                )}
              >
                {STAGE_COPY[stage]}
              </p>
              {stage === "approved" && (
                <p className="text-[10px] text-neutral-400">
                  {receiptEmail ? `Receipt sent to ${receiptEmail}` : "No receipt requested"}
                </p>
              )}
            </div>
          </div>

          <p className="text-[8px] tracking-wide text-neutral-300">Powered by stripe</p>
        </div>
      </div>
    </div>
  );
}
