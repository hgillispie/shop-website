"use client";

import { useState, useTransition } from "react";
import { emailInvoiceCopy } from "@/app/admin/(dashboard)/invoices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServiceInvoiceRow } from "@/lib/db/schema";
import { customerDocumentStage } from "@/lib/invoices/document-stage";

export function EmailInvoiceCopyButton({ invoice }: { invoice: ServiceInvoiceRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const isQuote = customerDocumentStage(invoice) === "quote";

  function handleSend() {
    setError(null);
    startTransition(async () => {
      try {
        await emailInvoiceCopy(invoice.id);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't email PDF copy.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            {isQuote ? "Send quote (PDF)" : "Email invoice copy (PDF)"}
          </p>
          <p className="text-xs text-muted">
            {isQuote
              ? "Emails an estimate PDF stamped QUOTE — NOT PAID, with an Approve this quote link. Doesn't create a pay link."
              : "Sends a PDF copy of this invoice. Doesn't affect payment status."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sent ? <Badge variant="accent">Sent</Badge> : null}
          <a
            href={`/admin/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent underline"
          >
            Preview PDF
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSend}
            disabled={isPending || !invoice.customerEmail}
          >
            {isPending ? "Sending…" : isQuote ? "Email quote PDF" : "Email PDF copy"}
          </Button>
        </div>
      </div>

      {!invoice.customerEmail ? (
        <p className="text-xs text-muted">Add a customer email to enable this.</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
