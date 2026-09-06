import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { About } from "@/components/sections/About";
import { ServicesDetail } from "@/components/sections/ServicesDetail";
import { FAQ } from "@/components/sections/FAQ";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { StructuredData } from "@/components/StructuredData";
import { TrackedLink } from "@/components/TrackedLink";
import { siteConfig } from "@/data/site-config";
import { aboutDescription, aboutTitle, SITE_NAME } from "@/data/seo";

const TITLE = `${aboutTitle} | ${SITE_NAME}`;

export const metadata: Metadata = {
  title: aboutTitle,
  description: aboutDescription,
  openGraph: {
    title: TITLE,
    description: aboutDescription,
    url: "/about",
    siteName: siteConfig.shopName,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: aboutDescription,
  },
};

export default function AboutPage() {
  return (
    <>
      <AnalyticsBeacon />
      <StructuredData />
      <Navbar />
      <main className="flex-1">
        <section className="bg-ink px-5 pt-32 pb-16 text-bone sm:px-6 sm:pt-40">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-ember">The shop</p>
            <h1 className="display-slant mt-5 text-[3rem] leading-[0.9] sm:text-7xl">
              Built around the bike.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone/70">
              Independent Harley shop in Taylors — choppers, club-style
              customs, bagger performance, and V-twin repair. Twenty years of
              dealership service-department work. Appointment only. No walk-ins.
            </p>
          </div>
        </section>

        <div className="bg-ink px-5 pb-16 sm:px-6">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px border-t border-hairline lg:grid-cols-4">
            {siteConfig.credentials.map((item) => (
              <div key={item.value} className="py-5 pr-4 lg:py-6">
                <dt className="display-caps text-2xl text-bone lg:text-3xl">
                  {item.value}
                </dt>
                <dd className="mt-1.5 text-xs leading-snug text-bone/60">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <About />
        <ServicesDetail />
        <FAQ />

        <section className="bg-ink-deep px-5 py-20 text-bone sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="display-caps max-w-lg text-4xl sm:text-5xl">
              Ready to get it in the shop?
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/#book"
                className="btn btn-primary eyebrow h-14 gap-2 px-8"
              >
                Request an appointment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <TrackedLink
                href={siteConfig.phoneHref}
                event="call_click"
                meta={{ location: "about_cta" }}
                className="btn btn-outline eyebrow h-14 gap-2 border-bone/25 px-7 text-bone hover:border-ember hover:bg-transparent hover:text-ember"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {siteConfig.phone}
              </TrackedLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
