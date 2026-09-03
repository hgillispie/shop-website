import Link from "next/link";
import { faqs } from "@/data/faq";
import { Reveal } from "@/components/Reveal";

export function FAQ() {
  return (
    <section
      id="faq"
      className="scroll-mt-(--header-h) bg-bone py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <Reveal>
          <p className="eyebrow text-flame">Before you reach out</p>
          <h2 className="display-caps mt-5 text-5xl text-ink sm:text-6xl">
            Good to know
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

        <p className="mt-10 text-center text-ink/60">
          Still not sure?{" "}
          <Link
            href="#book"
            className="font-semibold text-flame underline underline-offset-4 hover:text-ember"
          >
            Describe it in the form
          </Link>{" "}
          and you&apos;ll get a straight answer.
        </p>
      </div>
    </section>
  );
}
