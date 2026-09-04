import Link from "next/link";
import { getCrmHealthViews } from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { HealthBadge } from "@/components/admin/HealthBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, deleteCustomer, updateReviewOutreach } from "./actions";

export const dynamic = "force-dynamic";

function phoneHref(phone: string) {
  return `sms:${phone.replace(/[^\d+]/g, "")}`;
}

export default async function CrmPage() {
  const { views, askFirst } = await getCrmHealthViews();
  const openTickets = views
    .flatMap((view) =>
      view.tickets
        .filter(
          (ticket) =>
            ticket.status === "open" ||
            ticket.status === "in_progress" ||
            ticket.status === "waiting_on_customer",
        )
        .map((ticket) => ({ ticket, customer: view.customer })),
    )
    .sort((a, b) => b.ticket.createdAt.getTime() - a.ticket.createdAt.getTime());

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted">{views.length} total.</p>
        </div>

        <details className="w-80 rounded-lg border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium">+ New customer</summary>
          <form action={createCustomer} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <Button type="submit" size="sm" className="w-full">
              Add customer
            </Button>
          </form>
        </details>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Ask for a Google review first
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ranked by completed work, health, and their own words — not a dump of every customer.
        </p>
        {askFirst.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
            Nobody is ready yet. Finish a job for a happy customer, or approve a thread that
            includes a real compliment.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {askFirst.slice(0, 8).map((view, index) => (
              <li
                key={view.customer.id}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      <span className="mr-2 text-xs font-semibold text-muted">#{index + 1}</span>
                      <Link href={`/admin/crm/${view.customer.id}`} className="hover:text-accent">
                        {view.customer.name}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {view.customer.phone}
                      {view.customer.email ? ` · ${view.customer.email}` : ""}
                      {view.lastCompletedAt
                        ? ` · completed ${view.lastCompletedAt.toLocaleDateString()}`
                        : ""}
                    </p>
                    {view.bestQuote && (
                      <blockquote className="mt-2 text-sm text-foreground/90">
                        “{view.bestQuote}”
                      </blockquote>
                    )}
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                      {view.outreach.why.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <HealthBadge score={view.health.score} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ButtonLink href={phoneHref(view.customer.phone)} size="sm" variant="outline">
                    Text them
                  </ButtonLink>
                  {view.customer.email && (
                    <ButtonLink href={`mailto:${view.customer.email}`} size="sm" variant="outline">
                      Email
                    </ButtonLink>
                  )}
                  <form action={updateReviewOutreach} className="flex flex-wrap gap-2">
                    <input type="hidden" name="customerId" value={view.customer.id} />
                    <Button type="submit" name="reviewOutreach" value="asked" size="sm" variant="outline">
                      Mark asked
                    </Button>
                    <Button type="submit" name="reviewOutreach" value="reviewed" size="sm" variant="outline">
                      They reviewed
                    </Button>
                    <Button type="submit" name="reviewOutreach" value="skip" size="sm" variant="ghost">
                      Skip
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {openTickets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Open tickets ({openTickets.length})
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {openTickets.map(({ ticket, customer }) => (
                  <tr key={ticket.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/crm/${ticket.customerId}`}
                        className="font-medium hover:text-accent"
                      >
                        #{ticket.ticketNumber} {ticket.subject}
                      </Link>
                      <p className="text-xs text-muted">{customer.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Review</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {views.map((view) => (
              <tr key={view.customer.id} className="hover:bg-surface">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/crm/${view.customer.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {view.customer.name}
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <HealthBadge score={view.health.score} />
                </td>
                <td className="px-4 py-4 text-muted">{view.customer.phone}</td>
                <td className="px-4 py-4 text-muted">{view.customer.email ?? "—"}</td>
                <td className="px-4 py-4 text-muted capitalize">
                  {view.customer.reviewOutreach.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-4 text-muted">
                  {view.customer.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-right">
                  <form action={deleteCustomer}>
                    <input type="hidden" name="customerId" value={view.customer.id} />
                    <DeleteButton
                      confirmText={`Delete ${view.customer.name} and all of their jobs and tickets? This can't be undone.`}
                    />
                  </form>
                </td>
              </tr>
            ))}
            {views.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
