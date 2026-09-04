import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${siteConfig.shopName}`,
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ink px-5 pt-32 pb-24 text-bone sm:px-6">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow text-ember">Legal</p>
          <h1 className="display-caps mt-3 text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-bone/55">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-bone/80">
            <section>
              <h2 className="display-caps text-xl text-bone">Appointment-Only Service</h2>
              <p className="mt-2">
                {siteConfig.shopName} operates by appointment only. Submitting a request
                through this website does not guarantee a scheduled appointment — all
                requests are reviewed individually, and you will be contacted once a drop-off
                time is confirmed.
              </p>
            </section>

            <section>
              <h2 className="display-caps text-xl text-bone">SMS Messaging Terms</h2>
              <p className="mt-2">
                By providing your phone number when submitting an appointment request, you
                agree to receive text messages from {siteConfig.shopName} related to your
                appointment, including confirmation and scheduling details. Message and data
                rates may apply. Message frequency varies based on your appointment activity.
              </p>
              <p className="mt-2">
                Reply <strong>STOP</strong> to any message to opt out at any time. Reply{" "}
                <strong>HELP</strong> for assistance. Carriers are not liable for delayed or
                undelivered messages. We do not share, sell, or otherwise provide your mobile
                phone number or messaging consent information to any third parties or
                affiliates for marketing or promotional purposes.
              </p>
            </section>

            <section>
              <h2 className="display-caps text-xl text-bone">Photos &amp; Submitted Content</h2>
              <p className="mt-2">
                Photos and details you submit are used solely to evaluate your appointment
                request and perform the requested work.
              </p>
            </section>

            <section>
              <h2 className="display-caps text-xl text-bone">Contact</h2>
              <p className="mt-2">
                Questions about these terms? Contact us at{" "}
                <a href={`mailto:${siteConfig.email}`} className="text-ember hover:underline">
                  {siteConfig.email}
                </a>{" "}
                or {siteConfig.phone}.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
