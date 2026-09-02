import Link from "next/link";
import Script from "next/script";
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
      {/* Shopify's "Buy with Shop Pay" web component (see
          components/store/ShopPayButton.tsx) — loaded once here for the
          whole /store/* subtree rather than per-component, since both the
          product page and the grid's Quick View modal render that button
          via the shared AddToCartForm. next/script dedupes this across
          route navigations on its own. */}
      <Script
        src="https://cdn.shopify.com/shopifycloud/shop-js/modules/v2/loader.pay-button.esm.js"
        type="module"
        strategy="afterInteractive"
      />
      <Navbar />
      <div className="pt-16">
        <div className="sticky top-16 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2.5">
            <Link href="/store" className="text-xs text-muted hover:text-accent">
              ← Shop
            </Link>
            <Link
              href="/store/cart"
              className="text-xs font-medium text-foreground hover:text-accent"
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
