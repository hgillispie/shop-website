"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/store/CartProvider";
import { Badge } from "@/components/ui/badge";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/store/cart"
      className="relative inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      Cart
      {itemCount > 0 && (
        <Badge className="absolute -right-3 -top-2" aria-label={`${itemCount} items in cart`}>
          {itemCount}
        </Badge>
      )}
    </Link>
  );
}
