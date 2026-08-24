import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="mb-10 text-3xl font-semibold tracking-tight">Your cart</h1>

        {!cart || cart.lines.length === 0 ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted">Your cart is empty.</p>
            <ButtonLink href="/store">Continue shopping</ButtonLink>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="rounded-2xl border border-border/60 px-6">
              {cart.lines.map((line) => (
                <CartLineRow key={line.id} line={line} />
              ))}
            </div>

            <div className="flex flex-col gap-4 self-end text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {formatMoney(cart.cost.subtotalAmount)}
                </span>
              </div>
              <p className="text-xs text-muted">
                Shipping and tax are calculated at checkout.
              </p>
              <a
                href={cart.checkoutUrl}
                className="inline-flex h-14 items-center justify-center rounded-full bg-accent px-8 text-base font-medium tracking-wide text-white transition-colors hover:bg-accent/90"
              >
                Checkout
              </a>
              <Link href="/store" className="text-center text-xs text-muted hover:text-accent">
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
