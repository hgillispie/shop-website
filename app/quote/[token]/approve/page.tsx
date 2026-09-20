import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/data/site-config";
import { approveQuoteByToken } from "@/lib/invoices/approve-quote";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quote",
  robots: { index: false, follow: false },
};

type PageCopy = {
  eyebrow: string;
  title: string;
  body: string;
};

function copyForResult(
  result: Awaited<ReturnType<typeof approveQuoteByToken>>,
): PageCopy {
  if (!result.ok) {
    return {
      eyebrow: "Quote",
      title: "This approve link isn't valid",
      body: `Ask the shop to resend your quote, or call ${siteConfig.phone}.`,
    };
  }

  const n = result.invoice.invoiceNumber;
  if (result.invoice.paymentStatus === "paid") {
    return {
      eyebrow: `Invoice #${n}`,
      title: "This invoice is already paid",
      body: "You're all set — thank you.",
    };
  }

  if (
    result.invoice.documentStage === "invoice" ||
    result.invoice.paymentStatus === "invoice_sent"
  ) {
    return {
      eyebrow: `Invoice #${n}`,
      title: result.alreadyApproved
        ? "This quote is already an invoice"
        : "Quote recorded — this is now an invoice",
      body: "If you need to pay, check your email for the pay link, or call the shop.",
    };
  }

  if (result.alreadyApproved) {
    return {
      eyebrow: `Quote #${n}`,
      title: "This quote is already approved",
      body: "You're all set. The shop already has this.",
    };
  }

  return {
    eyebrow: `Quote #${n}`,
    title: "Quote approved",
    body: `Thanks, ${result.invoice.customerName}. The shop has been notified.`,
  };
}

export default async function ApproveQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await approveQuoteByToken(token);
  const copy = copyForResult(result);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-bone">
      <div className="w-full max-w-md">
        <Logo markClassName="h-12" priority />
        <p className="eyebrow mt-10 text-ember">{copy.eyebrow}</p>
        <h1 className="display-caps mt-3 text-4xl">{copy.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-bone/80">{copy.body}</p>
        <p className="mt-8 text-xs leading-relaxed text-bone/55">
          Questions? Call or text {siteConfig.phone}.
          <br />— {siteConfig.shopName}
        </p>
      </div>
    </div>
  );
}
