"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  printifyProductId: string;
  printifyVariantId: number;
  title: string;
  variantLabel: string | null;
  // Display only — re-priced for real server-side at checkout, never trusted.
  unitPriceCents: number;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  itemCount: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "swaffordspeed_store_cart";

// Printify variant ids come from the underlying blueprint+provider
// combination and can repeat across different products in the same shop —
// key cart lines by product+variant together, not variant alone.
function itemKey(productId: string, variantId: number) {
  return `${productId}:${variantId}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Deliberately reading localStorage here rather than in a useState
      // lazy initializer — this component renders during SSR too, where
      // localStorage isn't available. Reading it during render would return
      // different values on the server vs. the client's hydration pass,
      // causing a hydration mismatch; reading it after mount avoids that at
      // the cost of one extra render (empty -> populated).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt/blocked storage — start with an empty cart rather than throw.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/blocked — cart still works for this session, just
      // won't persist across a reload.
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    function addItem(item: Omit<CartItem, "quantity">, quantity: number) {
      const key = itemKey(item.printifyProductId, item.printifyVariantId);
      setItems((prev) => {
        const existing = prev.find(
          (i) => itemKey(i.printifyProductId, i.printifyVariantId) === key,
        );
        if (existing) {
          return prev.map((i) =>
            itemKey(i.printifyProductId, i.printifyVariantId) === key
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        }
        return [...prev, { ...item, quantity }];
      });
    }

    function updateQuantity(key: string, quantity: number) {
      setItems((prev) =>
        prev
          .map((i) =>
            itemKey(i.printifyProductId, i.printifyVariantId) === key
              ? { ...i, quantity }
              : i,
          )
          .filter((i) => i.quantity > 0),
      );
    }

    function removeItem(key: string) {
      setItems((prev) =>
        prev.filter((i) => itemKey(i.printifyProductId, i.printifyVariantId) !== key),
      );
    }

    function clear() {
      setItems([]);
    }

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

    return { items, addItem, updateQuantity, removeItem, clear, itemCount, subtotalCents };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { itemKey };
