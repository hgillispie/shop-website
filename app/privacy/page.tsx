import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.shopName}`,
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-ink px-5 pt-32 pb-24 text-bone sm:px-6">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow text-ember">Legal</p>
          <h1 className="display-caps mt-3 text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-bone/55">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-bone/80">
            <section>
              <h2 className="display-caps text-xl text-bone">Information We Collect</h2>
              <p className="mt-2">
                When you submit an appointment request through our website, we collect your
                name, phone number, email address, information about your motorcycle, a
                description of the work requested, and any photos you choose to upload.
              </p>
            </section>

            <section>
              <h2 className="display-caps text-xl text-bone">How We Use Your Information</h2>
              <p className="mt-2">
                We use this information to review your appointment request, contact you about
                scheduling, and provide the service you requested. This includes sending you
                email and SMS text messages about your appointment — for example, a
                confirmation once your appointment is approved, including the shop&apos;s
                drop-off address and time.
              </p>
            </section>

            <section>
              <h2 className="display-caps text-xl text-bone">SMS Consent &amp; Opt-Out</h2>
              <p className="mt-2">
                By submitting the appointment request form and providing your phone number,
                you consent to receive SMS text messages from {siteConfig.shopName} related to
                your appointment. Message and data rates may apply. Message frequency varies.
                You can reply <strong>STOP</strong> at any time to opt out of SMS messages, or{" "}
                <strong>HELP</strong> for assistance. We do not share, sell, or otherwise
                provide your mobile phone number or messaging consent information to any
                third parties or affiliates for marketing or promotional purposes.
              </p>
            </section>

            <section>
              <h2 className="display-caps text-xl text-bone">Data Retention</h2>
              <p className="mt-2">
                We retain appointment request information for as long as needed to provide our
                services and maintain business records. Photos you upload are stored securely
                and used only to evaluate and complete the requested work.
              </p>
            </section>

            <section>
              <h2 className="display-caps text-xl text-bone">Contact Us</h2>
              <p className="mt-2">
                Questions about this policy or your information? Contact us at{" "}
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
