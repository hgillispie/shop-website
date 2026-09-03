import Link from "next/link";
import { faqs } from "@/data/faq";
import { Reveal } from "@/components/Reveal";

export function FAQ() {
  return (
    <section
      id="faq"
      className="scroll-mt-16 bg-bone py-20 sm:scroll-mt-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <Reveal>
          <p className="eyebrow text-flame-deep">Before you reach out</p>
          <h2 className="display-caps mt-5 text-5xl text-ink sm:text-6xl">
            Good questions. Straight answers.
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="collapse-plus collapse border border-ink/10 bg-white"
            >
              <summary className="collapse-title text-base font-semibold text-ink">
                {item.question}
              </summary>
              <div className="collapse-content text-sm leading-relaxed text-ink/70">
                {item.answer}
              </div>
            </details>
          ))}
        </div>

        <p className="mt-10 text-center text-ink/65">
          Still not sure whether the shop is the right fit?{" "}
          <Link
            href="#book"
            className="font-semibold text-flame-deep underline underline-offset-4 hover:text-flame"
          >
            Describe it in the form
          </Link>{" "}
          or call and talk it through first.
        </p>
      </div>
    </section>
  );
}
