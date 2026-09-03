import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { capabilities } from "@/data/services";

export function Services() {
  return (
    <section id="services" className="scroll-mt-(--header-h) bg-bone py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <h2 className="display-caps text-4xl text-ink sm:text-5xl">
          What we do
        </h2>

        <ul className="mt-8 grid gap-px border-t border-ink/15 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability, i) => (
            <li
              key={capability.title}
              className="flex items-baseline gap-4 border-b border-ink/15 py-4"
            >
              <span className="display-slant text-sm text-flame-deep">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="display-caps text-xl text-ink">
                {capability.title}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/about"
          className="eyebrow mt-8 inline-flex items-center gap-2 text-flame-deep underline decoration-2 underline-offset-4 hover:text-ink"
        >
          What each of these involves
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
