"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDown, Phone } from "lucide-react";
import { faqs } from "@/data/faq";
import { siteConfig } from "@/data/site-config";

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24 bg-brand-cream py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-rust">Before you reach out</p>
          <h2 className="mt-4 font-display text-5xl uppercase leading-[0.95] text-brand-ink sm:text-6xl">
            Good questions. Straight answers.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-brand-ink/55">
            Still not sure whether the shop is the right fit? Call and talk it through before submitting a request.
          </p>
          <a
            href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-ink hover:text-brand-rust"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {siteConfig.phone}
          </a>
        </div>

        <div className="border-t-2 border-brand-ink">
          {faqs.map((item, index) => (
            <Disclosure key={item.question}>
              {({ open }) => (
                <div className="border-b border-brand-ink/20">
                  <DisclosureButton className="group flex w-full items-center gap-5 py-6 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-rust sm:py-7">
                    <span className="font-mono text-[11px] font-bold text-brand-rust">0{index + 1}</span>
                    <span className="flex-1 text-base font-bold text-brand-ink sm:text-lg">{item.question}</span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-brand-ink/25 transition-colors group-hover:border-brand-rust group-hover:text-brand-rust">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </span>
                  </DisclosureButton>
                  <DisclosurePanel
                    transition
                    className="pb-7 pl-9 pr-12 text-sm leading-7 text-brand-ink/60 transition duration-200 ease-out data-closed:-translate-y-1 data-closed:opacity-0 sm:pl-10"
                  >
                    {item.answer}
                  </DisclosurePanel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  );
}
