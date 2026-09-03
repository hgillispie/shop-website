import Link from "next/link";
import { IntakeForm } from "@/components/booking/IntakeForm";

export function Booking() {
  return (
    <aside
      id="book"
      aria-labelledby="booking-heading"
      className="scroll-mt-28 border-t-4 border-brand-orange bg-brand-cream p-5 text-brand-ink shadow-[10px_10px_0_rgba(0,0,0,0.28)] sm:p-8"
    >
      <div className="flex items-center justify-between gap-4 border-b border-brand-ink/15 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-rust">Start here</p>
          <h2 id="booking-heading" className="mt-1 font-display text-4xl uppercase leading-none">
            Request a spot
          </h2>
        </div>
        <span className="bg-brand-ink px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          Appointment only
        </span>
      </div>

      <p className="mt-5 text-sm leading-6 text-brand-ink/65">
        Tell us what needs attention or what you want to improve. Every request is reviewed personally, and you&apos;ll hear back with next steps.
      </p>

      <div className="mt-6">
        <IntakeForm />
      </div>
      <p className="mt-4 text-center text-[11px] leading-5 text-brand-ink/45">
        Your details are only used to respond to your request. See our{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-brand-rust">
          privacy policy
        </Link>.
      </p>
    </aside>
  );
}
