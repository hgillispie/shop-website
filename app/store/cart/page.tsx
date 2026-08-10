"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, itemKey } from "@/components/store/CartProvider";
import { formatCents } from "@/lib/store/money";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotalCents } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Your cart is empty</h1>
        <ButtonLink href="/store" className="mt-6 inline-flex">
          Browse the store
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Your Cart</h1>

      <div className="mt-8 divide-y divide-border rounded-lg border border-border">
        {items.map((item) => {
          const key = itemKey(item.printifyProductId, item.printifyVariantId);
          return (
            <div key={key} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.variantLabel && (
                  <p className="text-xs text-muted">{item.variantLabel}</p>
                )}
                <p className="mt-1 text-sm text-muted">{formatCents(item.unitPriceCents)} each</p>
              </div>
              <Input
                type="number"
                min={1}
                max={20}
                value={item.quantity}
                onChange={(e) =>
                  updateQuantity(key, Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                }
                className="h-10 w-16 text-center"
              />
              <p className="w-20 text-right text-sm font-medium">
                {formatCents(item.unitPriceCents * item.quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(key)}
                className="text-xs text-muted hover:text-red-600"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
        <div>
          <p className="text-sm text-muted">Subtotal (shipping calculated at checkout)</p>
          <p className="text-lg font-semibold">{formatCents(subtotalCents)}</p>
        </div>
        <Button type="button" size="lg" onClick={() => router.push("/store/checkout")}>
          Checkout
        </Button>
      </div>

      <Link href="/store" className="mt-6 inline-block text-sm text-accent hover:underline">
        ← Continue shopping
      </Link>
    </div>
  );
}
