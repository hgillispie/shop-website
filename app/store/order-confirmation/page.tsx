import { getStoreOrderById } from "@/lib/db/queries";
import { formatCents } from "@/lib/store/money";
import { PendingPoll } from "@/components/store/PendingPoll";
import { ClearCartOnSuccess } from "@/components/store/ClearCartOnSuccess";
import { ButtonLink } from "@/components/ui/button";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderRef?: string }>;
}) {
  const { orderRef } = await searchParams;

  if (!orderRef) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-muted">No order to show.</p>
        <ButtonLink href="/store" className="mt-6 inline-flex">
          Back to the store
        </ButtonLink>
      </div>
    );
  }

  const order = await getStoreOrderById(orderRef);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-muted">We couldn&apos;t find that order.</p>
        <ButtonLink href="/store" className="mt-6 inline-flex">
          Back to the store
        </ButtonLink>
      </div>
    );
  }

  if (order.status === "pending_payment") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Finalizing your order…</h1>
        <p className="mt-2 text-sm text-muted">This usually takes just a few seconds.</p>
        <PendingPoll />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <ClearCartOnSuccess />
      <h1 className="text-2xl font-semibold tracking-tight">Thanks for your order!</h1>
      <p className="mt-2 text-sm text-muted">
        Order #{order.orderNumber}. A confirmation email is on its way
        {order.email ? ` to ${order.email}` : ""}.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-1">
            <span>
              {item.title}
              {item.variantLabel ? ` — ${item.variantLabel}` : ""} × {item.quantity}
            </span>
            <span>{formatCents(item.unitPriceCents * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatCents(order.totalCents)}</span>
        </div>
      </div>

      <ButtonLink href="/store" className="mt-8 inline-flex">
        Continue shopping
      </ButtonLink>
    </div>
  );
}
