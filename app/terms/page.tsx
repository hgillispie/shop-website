import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${siteConfig.shopName}`,
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-base font-semibold">Appointment-Only Service</h2>
          <p className="mt-2">
            {siteConfig.shopName} operates by appointment only. Submitting a request
            through this website does not guarantee a scheduled appointment — all
            requests are reviewed individually, and you will be contacted once a drop-off
            time is confirmed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">SMS Messaging Terms</h2>
          <p className="mt-2">
            By providing your phone number when submitting an appointment request, you
            agree to receive text messages from {siteConfig.shopName} related to your
            appointment, including confirmation and scheduling details. Message and data
            rates may apply. Message frequency varies based on your appointment activity.
          </p>
          <p className="mt-2">
            Reply <strong>STOP</strong> to any message to opt out at any time. Reply{" "}
            <strong>HELP</strong> for assistance. Carriers are not liable for delayed or
            undelivered messages.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Photos &amp; Submitted Content</h2>
          <p className="mt-2">
            Photos and details you submit are used solely to evaluate your appointment
            request and perform the requested work.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact</h2>
          <p className="mt-2">
            Questions about these terms? Contact us at{" "}
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
