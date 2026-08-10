import { notFound } from "next/navigation";
import { getStoreOrderById } from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents } from "@/lib/store/money";
import { retryPrintifyOrder, updateTracking } from "../actions";
import type { ShippingAddress } from "@/lib/validations/store";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getStoreOrderById(id);
  if (!order) notFound();

  const address = order.shippingAddress as ShippingAddress | null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">
            {order.email ?? "No email captured"} · {order.source === "online" ? "Online" : "In person"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status === "fulfillment_failed" && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Payment succeeded, but the Printify order failed to create.
          </p>
          {order.printifyError && (
            <p className="mt-1 text-xs text-red-700">{order.printifyError}</p>
          )}
          <form action={retryPrintifyOrder} className="mt-3">
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" size="sm" variant="outline">
              Retry Printify order
            </Button>
          </form>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <p className="text-xs uppercase text-muted">Items</p>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                {item.quantity}× {item.title}
                {item.variantLabel ? ` — ${item.variantLabel}` : ""}
              </span>
              <span>{formatCents(item.unitPriceCents * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Shipping</span>
            <span>{formatCents(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCents(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {address && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-6 text-sm">
          <p className="text-xs uppercase text-muted">Shipping address</p>
          <p className="mt-2">
            {address.firstName} {address.lastName}
            <br />
            {address.address1}
            {address.address2 ? <> {address.address2}</> : null}
            <br />
            {address.city}, {address.region} {address.zip}
            <br />
            {address.phone}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border p-6">
        <p className="text-xs uppercase text-muted">Fulfillment</p>
        <p className="mt-2 text-sm text-muted">
          Printify order: {order.printifyOrderId ?? "—"}
        </p>
        <form action={updateTracking} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <div>
            <Label htmlFor="trackingCarrier">Carrier</Label>
            <Input
              id="trackingCarrier"
              name="trackingCarrier"
              defaultValue={order.trackingCarrier ?? ""}
              className="h-10 w-32"
            />
          </div>
          <div>
            <Label htmlFor="trackingNumber">Tracking number</Label>
            <Input
              id="trackingNumber"
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              className="h-10 w-48"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}
