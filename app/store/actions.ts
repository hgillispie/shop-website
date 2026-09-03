"use server";

import { revalidatePath } from "next/cache";
import { clearCartId, getCartId, setCartId } from "@/lib/shopify/cart-cookie";
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartLine,
} from "@/lib/shopify/storefront";

// Returns the resulting cart's checkoutUrl — "Add to cart" ignores it,
// "Buy now" (AddToCartForm.tsx) uses it to redirect straight to Shopify's
// own checkout, skipping the /store/cart review page entirely.
export async function addToCartAction(merchandiseId: string, quantity: number) {
  if (quantity < 1) throw new Error("Quantity must be at least 1.");

  const cartId = await getCartId();
  const existing = cartId ? await getCart(cartId) : null;

  let cart;
  if (!existing) {
    // No cookie yet, or the cookie points at a cart Shopify no longer has
    // (its own retention, or it was already converted to an order) —
    // either way, start fresh rather than erroring on an add-to-cart click.
    cart = await createCart([{ merchandiseId, quantity }]);
    await setCartId(cart.id);
  } else {
    cart = await addCartLines(existing.id, [{ merchandiseId, quantity }]);
  }

  revalidatePath("/store/cart");
  return { checkoutUrl: cart.checkoutUrl };
}

export async function updateCartLineAction(lineId: string, quantity: number) {
  const cartId = await getCartId();
  if (!cartId) return;

  if (quantity <= 0) {
    await removeCartLines(cartId, [lineId]);
  } else {
    await updateCartLine(cartId, lineId, quantity);
  }
  revalidatePath("/store/cart");
}

export async function removeCartLineAction(lineId: string) {
  const cartId = await getCartId();
  if (!cartId) return;
  await removeCartLines(cartId, [lineId]);
  revalidatePath("/store/cart");
}

export async function clearInvalidCartAction() {
  await clearCartId();
  revalidatePath("/store/cart");
}
