import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCustomerById,
  getJobsForCustomer,
  getRequestsForCustomer,
  getTicketsForCustomer,
} from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTicket, updateTicketStatus } from "../actions";

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
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const [requests, jobs, tickets] = await Promise.all([
    getRequestsForCustomer(id),
    getJobsForCustomer(id),
    getTicketsForCustomer(id),
  ]);

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
        <span className="rounded-full bg-surface px-3 py-1 text-xs capitalize text-muted">
          {customer.source}
        </span>
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
              <form action={updateTicketStatus} className="mt-3 flex items-center gap-2">
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
                <span className="font-medium">{request.bikeYearMakeModel}</span>
                <span className="ml-2 text-xs text-muted">
                  {request.createdAt.toLocaleDateString()}
                </span>
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
              <div key={job.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="font-medium">
                  #{job.jobNumber} {job.title}
                </span>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
