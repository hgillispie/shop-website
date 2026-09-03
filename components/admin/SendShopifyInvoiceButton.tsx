"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendInvoiceToShopify } from "@/app/admin/(dashboard)/invoices/shopify-actions";
import { Button } from "@/components/ui/button";
import type { ServiceInvoiceRow } from "@/lib/db/schema";

const STATUS_LABEL: Record<ServiceInvoiceRow["paymentStatus"], string> = {
  not_sent: "Not sent",
  invoice_sent: "Invoice sent — awaiting payment",
  paid: "Paid",
};

export function SendShopifyInvoiceButton({ invoice }: { invoice: ServiceInvoiceRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSend() {
    setError(null);
    startTransition(async () => {
      try {
        await sendInvoiceToShopify(invoice.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't send invoice.");
      }
    });
  }

  const alreadyPaid = invoice.paymentStatus === "paid";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Shopify invoice</p>
          <p className="text-xs text-muted">{STATUS_LABEL[invoice.paymentStatus]}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSend}
          disabled={isPending || alreadyPaid}
        >
          {isPending
            ? "Sending…"
            : invoice.paymentStatus === "not_sent"
              ? "Send Shopify invoice"
              : "Resend Shopify invoice"}
        </Button>
      </div>

      {invoice.shopifyInvoiceUrl ? (
        <a
          href={invoice.shopifyInvoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent underline"
        >
          View checkout link
        </a>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
