"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeCartLineAction, updateCartLineAction } from "@/app/store/actions";
import { formatMoney } from "@/lib/shopify/money";
import type { CartLine } from "@/lib/shopify/types";

export function CartLineRow({ line }: { line: CartLine }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setQuantity(quantity: number) {
    startTransition(async () => {
      await updateCartLineAction(line.id, quantity);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartLineAction(line.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4 border-b border-hairline py-4 last:border-b-0">
      <div className="h-20 w-20 shrink-0 overflow-hidden bg-ink-soft">
        {line.image ? (
          <img
            src={line.image.url}
            alt={line.image.altText ?? line.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <p className="display-caps text-base text-bone">{line.title}</p>
        {line.variantTitle !== "Default Title" ? (
          <p className="text-xs text-bone/55">{line.variantTitle}</p>
        ) : null}
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="text-left text-xs text-bone/55 underline decoration-dotted hover:text-ember disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQuantity(line.quantity - 1)}
          disabled={isPending}
          className="btn btn-square btn-sm btn-outline border-hairline text-bone disabled:opacity-50"
        >
          −
        </button>
        <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQuantity(line.quantity + 1)}
          disabled={isPending}
          className="btn btn-square btn-sm btn-outline border-hairline text-bone disabled:opacity-50"
        >
          +
        </button>
      </div>

      <p className="w-20 text-right text-sm font-medium tabular-nums">
        {formatMoney(line.linePrice)}
      </p>
    </div>
  );
}
