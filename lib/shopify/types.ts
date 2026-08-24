// Minimal shapes this app actually uses — not a full mirror of Shopify's
// GraphQL schema. Storefront/Admin responses get mapped down to these at
// the one boundary (lib/shopify/storefront.ts, lib/shopify/admin.ts) so
// pages/components never touch raw GraphQL edges/nodes.

export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductImage = {
  url: string;
  altText: string | null;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: { name: string; value: string }[];
  image: ProductImage | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  images: ProductImage[];
  priceRange: { min: Money; max: Money };
  options: { name: string; values: string[] }[];
  variants: ProductVariant[];
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandiseId: string;
  title: string;
  variantTitle: string;
  image: ProductImage | null;
  linePrice: Money;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: CartLine[];
};
