import type { Metadata } from "next";
import { Mail, MapPin, Phone, Globe, UserPlus, Download } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { LogoMark } from "@/components/brand/Logo";
import { ContactQr } from "@/components/card/ContactQr";
import { siteConfig } from "@/data/site-config";
import {
  CANONICAL_VCARD_URL,
  shopContact,
  shopContactAddressLine,
  VCARD_FILENAME,
  VCARD_PATH,
} from "@/lib/vcard";

export const metadata: Metadata = {
  title: `Save Contact | ${siteConfig.shopName}`,
  description:
    "Save Matt Daves / Swafford Speed to your phone. Harley-Davidson performance and custom shop, Taylors, SC.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function CardPage() {
  return (
    <>
      <AnalyticsBeacon />
      <Navbar />
      <main className="flex-1 bg-ink text-bone">
        <section className="px-5 pt-32 pb-20 sm:px-6 sm:pt-40">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow text-ember">Contact card</p>
            <h1 className="display-slant mt-5 text-[3rem] leading-[0.9] sm:text-7xl">
              {shopContact.formattedName}
            </h1>
            <p className="mt-3 display-caps text-2xl text-ember sm:text-3xl">
              {shopContact.organization}
            </p>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-bone/65 sm:text-base">
              {shopContact.note}. Scan the QR or tap Save to Contacts — iPhone
              opens the native Add sheet; Android can download the same vCard.
            </p>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
              <article className="border border-hairline bg-ink-deep p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <LogoMark className="h-16" />
                  <div>
                    <p className="display-caps text-3xl sm:text-4xl">
                      {shopContact.formattedName}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-ember">
                      {shopContact.organization}
                    </p>
                    <p className="mt-2 text-sm text-bone/60">{shopContact.note}</p>
                  </div>
                </div>

                <dl className="mt-8 space-y-4 border-t border-hairline pt-6 text-sm">
                  <div className="flex items-start gap-3">
                    <Phone
                      className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="eyebrow text-bone/45">Phone</dt>
                      <dd className="mt-1.5">
                        <a
                          href={siteConfig.phoneHref}
                          className="font-semibold text-bone transition-colors hover:text-ember"
                        >
                          {siteConfig.phone}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="eyebrow text-bone/45">Email</dt>
                      <dd className="mt-1.5">
                        <a
                          href={`mailto:${shopContact.email}`}
                          className="text-bone/80 transition-colors hover:text-ember"
                        >
                          {shopContact.email}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="eyebrow text-bone/45">Address</dt>
                      <dd className="mt-1.5 text-bone/80">
                        {shopContactAddressLine}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe
                      className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="eyebrow text-bone/45">Website</dt>
                      <dd className="mt-1.5">
                        <a
                          href="https://swaffordspeed.com"
                          className="text-bone/80 transition-colors hover:text-ember"
                        >
                          swaffordspeed.com
                        </a>
                      </dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={VCARD_PATH}
                    className="btn btn-primary eyebrow h-14 gap-2 px-8"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Save to Contacts
                  </a>
                  <a
                    href={VCARD_PATH}
                    download={VCARD_FILENAME}
                    className="btn btn-outline eyebrow h-14 gap-2 border-bone/25 px-7 text-bone hover:border-ember hover:bg-transparent hover:text-ember"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download vCard
                  </a>
                </div>
              </article>

              <aside className="border border-hairline bg-bone p-6 text-ink sm:p-7">
                <p className="eyebrow text-flame-deep">Print this QR</p>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  Camera-scan or NFC this code to open the contact card. Points
                  at the vCard file, not this page.
                </p>
                <div className="mx-auto mt-6 max-w-[16rem]">
                  <ContactQr url={CANONICAL_VCARD_URL} className="h-auto w-full" />
                </div>
                <p className="mt-4 break-all text-center font-mono text-[0.7rem] text-ink/55">
                  {CANONICAL_VCARD_URL.replace("https://", "")}
                </p>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
