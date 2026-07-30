import { IntakeForm } from "@/components/booking/IntakeForm";
import { Reveal } from "@/components/Reveal";

export function Booking() {
  return (
    <section id="book" className="scroll-mt-16 bg-surface-dark py-24 text-foreground-dark">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Get Started
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tell James about your bike.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-dark">
            Fill this out and James will get back to you personally — usually
            the same day.
          </p>
        </Reveal>

        <div className="mt-10 rounded-lg border border-border-dark bg-background p-6 text-foreground sm:p-10">
          <IntakeForm />
        </div>
      </div>
    </section>
  );
}
