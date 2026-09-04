import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { CartLineRow } from "@/components/store/CartLineRow";
import { getCartId } from "@/lib/shopify/cart-cookie";
import { formatMoney } from "@/lib/shopify/money";
import { getCart } from "@/lib/shopify/storefront";

export default async function CartPage() {
  const cartId = await getCartId();
  const cart = cartId
    ? await getCart(cartId).catch((error) => {
        console.error("[store] failed to load cart:", error);
        return null;
      })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-5 pt-12 pb-24 sm:px-6">
      <p className="eyebrow text-ember">Checkout</p>
      <h1 className="display-caps mt-3 mb-10 text-4xl text-bone">Your cart</h1>

      {!cart || cart.lines.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm text-bone/60">Your cart is empty.</p>
          <ButtonLink href="/store">Continue shopping</ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="border border-hairline px-6">
            {cart.lines.map((line) => (
              <CartLineRow key={line.id} line={line} />
            ))}
          </div>

          <div className="flex flex-col gap-4 self-end text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-bone/60">Subtotal</span>
              <span className="font-medium tabular-nums">
                {formatMoney(cart.cost.subtotalAmount)}
              </span>
            </div>
            <p className="text-xs text-bone/55">Shipping and tax are calculated at checkout.</p>
            <ButtonLink href={cart.checkoutUrl} size="lg">
              Checkout
            </ButtonLink>
            <Link
              href="/store"
              className="eyebrow text-center text-bone/55 transition-colors hover:text-ember"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
