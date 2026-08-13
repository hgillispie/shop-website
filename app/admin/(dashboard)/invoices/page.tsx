import Link from "next/link";
import { getServiceInvoices } from "@/lib/db/queries";
import { formatCents } from "@/lib/store/money";
import { formatDateWritten } from "@/lib/invoices/date";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const invoices = await getServiceInvoices();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Service Invoices</h1>
          <p className="mt-1 text-sm text-muted">{invoices.length} total — newest first.</p>
        </div>
        <ButtonLink href="/admin/invoices/new">New Invoice</ButtonLink>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">R.O. #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Date written</th>
              <th className="px-4 py-3">Total due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => {
              const vehicle = [invoice.vehicleYear, invoice.vehicleMake, invoice.vehicleModel]
                .filter(Boolean)
                .join(" ");
              return (
                <tr key={invoice.id} className="hover:bg-surface">
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/invoices/${invoice.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      #{invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-4">{invoice.customerName}</td>
                  <td className="px-4 py-4 text-muted">{vehicle || "—"}</td>
                  <td className="px-4 py-4 text-muted">{formatDateWritten(invoice.dateWritten)}</td>
                  <td className="px-4 py-4 font-medium tabular-nums">
                    {formatCents(invoice.totalDueCents)}
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No invoices yet.{" "}
                  <Link href="/admin/invoices/new" className="text-accent hover:underline">
                    Create the first one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
