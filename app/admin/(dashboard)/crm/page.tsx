import Link from "next/link";
import { getAllTickets, getCustomers } from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, deleteCustomer } from "./actions";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const [customers, allTickets] = await Promise.all([getCustomers(), getAllTickets()]);
  const openTickets = allTickets.filter(
    (t) => t.status === "open" || t.status === "in_progress" || t.status === "waiting_on_customer",
  );

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted">{customers.length} total.</p>
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

      {openTickets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Open tickets ({openTickets.length})
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {openTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/crm/${ticket.customerId}`}
                        className="font-medium hover:text-accent"
                      >
                        #{ticket.ticketNumber} {ticket.subject}
                      </Link>
                      <p className="text-xs text-muted">{ticket.customer?.name}</p>
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
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-surface">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/crm/${customer.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {customer.name}
                  </Link>
                </td>
                <td className="px-4 py-4 text-muted">{customer.phone}</td>
                <td className="px-4 py-4 text-muted">{customer.email ?? "—"}</td>
                <td className="px-4 py-4 text-muted capitalize">{customer.source}</td>
                <td className="px-4 py-4 text-muted">
                  {customer.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-right">
                  <form action={deleteCustomer}>
                    <input type="hidden" name="customerId" value={customer.id} />
                    <DeleteButton
                      confirmText={`Delete ${customer.name} and all of their jobs and tickets? This can't be undone.`}
                    />
                  </form>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
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
