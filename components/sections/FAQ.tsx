import { faqs } from "@/data/faq";
import { Reveal } from "@/components/Reveal";

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-16 bg-background py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Questions
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Good to know before you reach out.
          </h2>
        </Reveal>

        <div className="mt-10 divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium marker:content-none">
                {item.question}
                <span
                  className="text-accent transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
