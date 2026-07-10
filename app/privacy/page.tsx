import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.shopName}`,
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-base font-semibold">Information We Collect</h2>
          <p className="mt-2">
            When you submit an appointment request through our website, we collect your
            name, phone number, email address, information about your motorcycle, a
            description of the work requested, and any photos you choose to upload.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">How We Use Your Information</h2>
          <p className="mt-2">
            We use this information to review your appointment request, contact you about
            scheduling, and provide the service you requested. This includes sending you
            email and SMS text messages about your appointment — for example, a
            confirmation once your appointment is approved, including the shop&apos;s
            drop-off address and time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">SMS Consent &amp; Opt-Out</h2>
          <p className="mt-2">
            By submitting the appointment request form and providing your phone number,
            you consent to receive SMS text messages from {siteConfig.shopName} related to
            your appointment. Message and data rates may apply. Message frequency varies.
            You can reply <strong>STOP</strong> at any time to opt out of SMS messages, or{" "}
            <strong>HELP</strong> for assistance. We do not sell or share your phone number
            with third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Data Retention</h2>
          <p className="mt-2">
            We retain appointment request information for as long as needed to provide our
            services and maintain business records. Photos you upload are stored securely
            and used only to evaluate and complete the requested work.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact Us</h2>
          <p className="mt-2">
            Questions about this policy or your information? Contact us at{" "}
            <a href={`mailto:${siteConfig.email}`} className="text-accent hover:underline">
              {siteConfig.email}
            </a>{" "}
            or {siteConfig.phone}.
          </p>
        </section>
      </div>
    </main>
  );
}
