import "server-only";
import { cookies } from "next/headers";

// httpOnly — nothing client-side ever needs to read this directly; every
// cart read/mutation goes through a Server Action or a server component,
// same posture as the session cookie in lib/auth/session.ts.
const CART_COOKIE = "shopify_cart_id";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function getCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export async function setCartId(cartId: string) {
  const store = await cookies();
  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function clearCartId() {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
