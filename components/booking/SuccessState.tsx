"use client";

import { CalendarCheck } from "lucide-react";

export function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="border border-brand-ink/15 bg-white p-6 text-center sm:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center bg-brand-orange text-brand-ink">
        <CalendarCheck className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-6 font-display text-4xl uppercase leading-none text-brand-ink">
        Request received
      </h3>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-brand-ink/65">
        Your request will be reviewed personally. Once a spot is approved, you&apos;ll receive a text confirmation with the shop address and drop-off time.
      </p>
      <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-brand-ink/45">
        Nothing is scheduled yet, so keep an eye on your phone for a call or text back.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-brand-rust underline-offset-4 hover:underline"
      >
        Submit another request
      </button>
    </div>
  );
}
