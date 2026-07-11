import { IntakeForm } from "@/components/booking/IntakeForm";

export function Booking() {
  return (
    <section id="book" className="scroll-mt-16 bg-surface-dark py-24 text-foreground-dark">
      <div className="mx-auto max-w-3xl px-6">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Contact us
        </p>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Schedule Appointment
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-dark">
          This shop works by appointment only. Submit the details below and
          you&apos;ll hear back ASAP
        </p>

        <div className="mt-10 rounded-lg border border-border-dark bg-background p-6 text-foreground sm:p-10">
          <IntakeForm />
        </div>
      </div>
    </section>
  );
}
