import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCustomerHealthView,
  getRequestsForCustomer,
} from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { HealthBadge } from "@/components/admin/HealthBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addCustomerQuote,
  createTicket,
  deleteCustomer,
  deleteQuote,
  deleteTicket,
  toggleQuoteForSite,
  updateReviewOutreach,
  updateTicketStatus,
} from "../actions";

const TICKET_STATUSES = [
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
] as const;

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const view = await getCustomerHealthView(id);
  if (!view) notFound();
  const customer = view.customer;
  const jobs = view.jobs;
  const tickets = view.tickets;
  const requests = await getRequestsForCustomer(id);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/crm" className="text-xs text-muted hover:text-accent">
        ← All customers
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {customer.phone} {customer.email ? `· ${customer.email}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HealthBadge score={view.health.score} />
          <span className="rounded-full bg-surface px-3 py-1 text-xs capitalize text-muted">
            {customer.source}
          </span>
          <form action={deleteCustomer}>
            <input type="hidden" name="customerId" value={customer.id} />
            <DeleteButton
              confirmText={`Delete ${customer.name} and all of their jobs and tickets? This can't be undone.`}
            />
          </form>
        </div>
      </div>

      {view.health.reasons.length > 0 && (
        <p className="mt-3 text-xs text-muted">{view.health.reasons.join(" · ")}</p>
      )}

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Google review</h2>
            <p className="mt-1 text-sm text-muted">
              {view.outreach.eligible
                ? "Ask this person next — completed work and health line up."
                : customer.reviewOutreach === "not_asked"
                  ? "Not first in line yet. Finish work, or wait until the conversation is clearly good."
                  : `Status: ${customer.reviewOutreach.replace(/_/g, " ")}.`}
            </p>
          </div>
          <form action={updateReviewOutreach} className="flex flex-wrap gap-2">
            <input type="hidden" name="customerId" value={customer.id} />
            {customer.reviewOutreach === "not_asked" ? (
              <>
                <Button type="submit" name="reviewOutreach" value="asked" size="sm">
                  Mark asked
                </Button>
                <Button type="submit" name="reviewOutreach" value="reviewed" size="sm" variant="outline">
                  They reviewed
                </Button>
                <Button type="submit" name="reviewOutreach" value="skip" size="sm" variant="ghost">
                  Skip
                </Button>
              </>
            ) : (
              <Button type="submit" name="reviewOutreach" value="not_asked" size="sm" variant="outline">
                Put back in queue
              </Button>
            )}
          </form>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Quotes ({view.quotes.length})
        </h2>
        <p className="mt-1 text-xs text-muted">
          Direct lines from their texts. Flag the good ones for later use on the site.
        </p>
        <div className="mt-3 space-y-3">
          {view.quotes.map((quote) => (
            <div key={quote.id} className="rounded-lg border border-border p-4">
              <blockquote className="text-sm">“{quote.quote}”</blockquote>
              <p className="mt-2 text-xs capitalize text-muted">
                {quote.sentiment} · {quote.source}
                {quote.approvedForSite ? " · flagged for site" : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quote.sentiment === "positive" && (
                  <form action={toggleQuoteForSite}>
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <input
                      type="hidden"
                      name="approvedForSite"
                      value={quote.approvedForSite ? "true" : "false"}
                    />
                    <Button type="submit" size="sm" variant="outline">
                      {quote.approvedForSite ? "Remove from site list" : "Use on site later"}
                    </Button>
                  </form>
                )}
                <form action={deleteQuote}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="customerId" value={customer.id} />
                  <DeleteButton confirmText="Delete this quote?" />
                </form>
              </div>
            </div>
          ))}
          {view.quotes.length === 0 && (
            <p className="text-sm text-muted">No quotes yet. Approve a screenshot thread, or add one below.</p>
          )}
        </div>
        <form
          action={addCustomerQuote}
          className="mt-4 space-y-3 rounded-lg border border-dashed border-border p-4"
        >
          <input type="hidden" name="customerId" value={customer.id} />
          <div>
            <Label htmlFor="quote">Add a quote in their words</Label>
            <Textarea id="quote" name="quote" required minLength={16} />
          </div>
          <div>
            <Label htmlFor="sentiment">Tone</Label>
            <select
              id="sentiment"
              name="sentiment"
              defaultValue="positive"
              className="mt-1 h-9 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="positive">Compliment</option>
              <option value="negative">Complaint</option>
            </select>
          </div>
          <Button type="submit" size="sm" variant="outline">
            Save quote
          </Button>
        </form>
      </div>

      {(customer.address || customer.notes) && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">
          {customer.address && <p>{customer.address}</p>}
          {customer.notes && <p className="mt-2 whitespace-pre-wrap text-muted">{customer.notes}</p>}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Tickets ({tickets.length})
        </h2>

        <div className="mt-3 space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    #{ticket.ticketNumber} {ticket.subject}
                  </p>
                  {ticket.details && (
                    <p className="mt-1 text-sm text-muted">{ticket.details}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {ticket.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <form action={updateTicketStatus} className="flex items-center gap-2">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <input type="hidden" name="customerId" value={customer.id} />
                  <select
                    name="status"
                    defaultValue={ticket.status}
                    className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    {TICKET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline">
                    Update
                  </Button>
                </form>
                <form action={deleteTicket}>
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <input type="hidden" name="customerId" value={customer.id} />
                  <DeleteButton confirmText={`Delete ticket #${ticket.ticketNumber}?`} />
                </form>
              </div>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-sm text-muted">No tickets yet.</p>}
        </div>

        <form
          action={createTicket}
          className="mt-4 space-y-3 rounded-lg border border-dashed border-border p-4"
        >
          <input type="hidden" name="customerId" value={customer.id} />
          <div>
            <Label htmlFor="subject">New ticket subject</Label>
            <Input id="subject" name="subject" required />
          </div>
          <div>
            <Label htmlFor="details">Details</Label>
            <Input id="details" name="details" />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Add ticket
          </Button>
        </form>
      </div>

      {requests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Appointment requests ({requests.length})
          </h2>
          <div className="mt-3 space-y-2">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/admin/requests/${request.id}`}
                className="block rounded-lg border border-border p-3 text-sm hover:border-accent"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{request.bikeYearMakeModel}</span>
                  <span className="text-xs text-muted">
                    {request.createdAt.toLocaleDateString()}
                  </span>
                </div>
                {request.serviceTypes.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {request.serviceTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-accent"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}
                {request.details && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted">{request.details}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Jobs ({jobs.length})
          </h2>
          <div className="mt-3 space-y-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/board/${job.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-accent"
              >
                <span className="font-medium">
                  #{job.jobNumber} {job.title}
                </span>
                <StatusBadge status={job.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
