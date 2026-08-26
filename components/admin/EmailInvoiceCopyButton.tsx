"use client";

import { useState, useTransition } from "react";
import { emailInvoiceCopy } from "@/app/admin/(dashboard)/invoices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServiceInvoiceRow } from "@/lib/db/schema";

// Separate from SendShopifyInvoiceButton on purpose — this doesn't read or
// write paymentStatus, so there's no persisted state to render here beyond
// a transient "Sent" confirmation for this page view.
export function EmailInvoiceCopyButton({ invoice }: { invoice: ServiceInvoiceRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSend() {
    setError(null);
    startTransition(async () => {
      try {
        await emailInvoiceCopy(invoice.id);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't email invoice copy.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Email invoice copy</p>
          <p className="text-xs text-muted">
            Sends a PDF copy to the customer — for in-person or already-paid visits. Doesn&rsquo;t
            affect payment status.
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
            {isPending ? "Sending…" : "Email PDF copy"}
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
