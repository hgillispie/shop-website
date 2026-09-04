import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCartId } from "@/lib/shopify/cart-cookie";
import { getCart } from "@/lib/shopify/storefront";

// Shared across every /store/* page specifically so the cart is reachable
// from anywhere in the store — the product detail page had no way back to
// it before this without going back through /store first.
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const cartId = await getCartId();
  const cart = cartId
    ? await getCart(cartId).catch(() => null)
    : null;

  return (
    <>
      <Navbar />
      <div className="bg-ink pt-(--header-h) text-bone">
        <div className="sticky top-(--header-h) z-40 border-b border-hairline bg-ink/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6">
            <Link
              href="/"
              className="eyebrow text-bone/70 transition-colors hover:text-ember"
            >
              ← Home
            </Link>
            <Link
              href="/store/cart"
              className="eyebrow text-bone/70 transition-colors hover:text-ember"
            >
              Cart{cart && cart.totalQuantity > 0 ? ` (${cart.totalQuantity})` : ""}
            </Link>
          </div>
        </div>
        {children}
      </div>
      <Footer />
    </>
  );
}
