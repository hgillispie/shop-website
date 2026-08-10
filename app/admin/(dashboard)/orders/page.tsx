import Link from "next/link";
import { getStoreOrders } from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCents } from "@/lib/store/money";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getStoreOrders();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Store Orders</h1>
      <p className="mt-1 text-sm text-muted">{orders.length} total — newest first.</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-surface">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    #{order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted">{order.email ?? "No email captured"}</p>
                </td>
                <td className="px-4 py-4 text-muted capitalize">{order.source.replace("_", " ")}</td>
                <td className="px-4 py-4 text-muted">{formatCents(order.totalCents)}</td>
                <td className="px-4 py-4 text-muted">{order.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
