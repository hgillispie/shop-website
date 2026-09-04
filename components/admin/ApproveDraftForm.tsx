"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveIntakeDraft, deleteJob } from "@/app/admin/(dashboard)/board/actions";
import type { IntakeDraftRow } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ApproveDraftForm({
  jobId,
  jobNumber,
  draft,
}: {
  jobId: string;
  jobNumber: number;
  draft: IntakeDraftRow;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-6 space-y-4 rounded-lg border border-dashed border-accent/50 bg-surface p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setPending(true);
        try {
          await approveIntakeDraft(new FormData(event.currentTarget));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not approve draft.");
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="jobId" value={jobId} />
      <div>
        <h2 className="text-sm font-semibold">Review extracted details</h2>
        <p className="mt-1 text-sm text-muted">
          Approving creates (or matches) a customer, opens a ticket, and moves this
          job to Backlog. Name and phone are required.
        </p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="customerName">Customer name</Label>
          <Input
            id="customerName"
            name="customerName"
            defaultValue={draft.customerName ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerPhone">Phone</Label>
          <Input
            id="customerPhone"
            name="customerPhone"
            defaultValue={draft.customerPhone ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            name="customerEmail"
            type="email"
            defaultValue={draft.customerEmail ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="bikeYearMakeModel">Bike</Label>
          <Input
            id="bikeYearMakeModel"
            name="bikeYearMakeModel"
            defaultValue={draft.bikeYearMakeModel ?? ""}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="workNeeded">Work needed</Label>
        <Textarea id="workNeeded" name="workNeeded" defaultValue={draft.workNeeded ?? ""} />
      </div>
      <div>
        <Label htmlFor="conversationSummary">Conversation summary</Label>
        <Textarea
          id="conversationSummary"
          name="conversationSummary"
          defaultValue={draft.conversationSummary ?? ""}
        />
      </div>
      {draft.extracted &&
        ((draft.extracted.positiveQuotes ?? []).length > 0 ||
          (draft.extracted.negativeQuotes ?? []).length > 0) && (
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Quotes from the thread
            </p>
            {(draft.extracted.positiveQuotes ?? []).map((quote) => (
              <p key={quote} className="mt-2 text-sm">
                “{quote}”
              </p>
            ))}
            {(draft.extracted.negativeQuotes ?? []).map((quote) => (
              <p key={quote} className="mt-2 text-sm text-muted">
                Complaint: “{quote}”
              </p>
            ))}
          </div>
        )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Approving…" : "Approve draft"}
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            if (!confirm(`Discard draft #${jobNumber}? Nothing will be created in the CRM.`)) {
              return;
            }
            setPending(true);
            await deleteJob(jobId);
            router.push("/admin/board");
          }}
          className="text-sm text-muted hover:text-red-600 disabled:opacity-50"
        >
          Discard draft
        </button>
      </div>
    </form>
  );
}
