import "server-only";
import type { Cart, Product } from "./types";

// Confirmed live against the real store during setup (see
// .claude/skills/shopify-api-auth) — pin rather than "latest"/"unstable" so
// a future Shopify version bump doesn't silently change response shapes
// under us.
const API_VERSION = "2025-10";

function endpoint() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) {
    throw new Error("SHOPIFY_STORE_DOMAIN is not set. Add it to .env.local.");
  }
  return `https://${domain}/api/${API_VERSION}/graphql.json`;
}

// The Storefront API's current private-token format (shpat_-prefixed, same
// prefix family as Admin tokens) MUST be sent as `Shopify-Storefront-Private-Token`.
// The older `X-Shopify-Storefront-Access-Token` header silently 401s it —
// see .claude/skills/shopify-api-auth for the full story. Don't "fix" this
// back to the classic header without re-reading that.
async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set. Add it to .env.local.");
  }

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    // Product catalog changes rarely — short revalidation window rather
    // than no-cache, same reasoning the old lib/printify.ts used (see
    // project_store_ecommerce memory: too-long a window made new products
    // invisible for up to an hour, so this errs shorter).
    next: { revalidate: 60, tags: ["shopify-products"] },
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(
      `Shopify Storefront API error (${res.status}): ${JSON.stringify(json.errors ?? json)}`,
    );
  }
  return json.data as T;
}

// Cart mutations must never be cached — always fetch fresh.
async function storefrontMutate<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set. Add it to .env.local.");
  }

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(
      `Shopify Storefront API error (${res.status}): ${JSON.stringify(json.errors ?? json)}`,
    );
  }
  return json.data as T;
}

function throwOnUserErrors(userErrors: { field: string[] | null; message: string }[]) {
  if (userErrors && userErrors.length > 0) {
    throw new Error(userErrors.map((e) => e.message).join("; "));
  }
}

const PRODUCT_FIELDS = /* GraphQL */ `
  id
  handle
  title
  description
  images(first: 10) {
    edges { node { url altText } }
  }
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  options { name values }
  variants(first: 100) {
    edges {
      node {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
        image { url altText }
      }
    }
  }
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(node: any): Product {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    images: node.images.edges.map((e: any) => ({ url: e.node.url, altText: e.node.altText })), // eslint-disable-line @typescript-eslint/no-explicit-any
    priceRange: {
      min: node.priceRange.minVariantPrice,
      max: node.priceRange.maxVariantPrice,
    },
    options: node.options,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variants: node.variants.edges.map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      availableForSale: e.node.availableForSale,
      price: e.node.price,
      selectedOptions: e.node.selectedOptions,
      image: e.node.image,
    })),
  };
}

export async function getProducts({ first = 48 }: { first?: number } = {}): Promise<Product[]> {
  const data = await storefrontFetch<{ products: { edges: { node: unknown }[] } }>(
    /* GraphQL */ `
      query Products($first: Int!) {
        products(first: $first, sortKey: TITLE) {
          edges { node { ${PRODUCT_FIELDS} } }
        }
      }
    `,
    { first },
  );
  return data.products.edges.map((e) => mapProduct(e.node));
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const data = await storefrontFetch<{ product: unknown | null }>(
    /* GraphQL */ `
      query ProductByHandle($handle: String!) {
        product(handle: $handle) { ${PRODUCT_FIELDS} }
      }
    `,
    { handle },
  );
  return data.product ? mapProduct(data.product) : null;
}

const CART_FIELDS = /* GraphQL */ `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            image { url altText }
            product { title }
          }
        }
      }
    }
  }
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCart(node: any): Cart {
  return {
    id: node.id,
    checkoutUrl: node.checkoutUrl,
    totalQuantity: node.totalQuantity,
    cost: node.cost,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lines: node.lines.edges.map((e: any) => ({
      id: e.node.id,
      quantity: e.node.quantity,
      merchandiseId: e.node.merchandise.id,
      title: e.node.merchandise.product.title,
      variantTitle: e.node.merchandise.title,
      image: e.node.merchandise.image,
      linePrice: e.node.cost.totalAmount,
    })),
  };
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefrontMutate<{ cart: unknown | null }>(
    /* GraphQL */ `
      query GetCart($cartId: ID!) {
        cart(id: $cartId) { ${CART_FIELDS} }
      }
    `,
    { cartId },
  );
  return data.cart ? mapCart(data.cart) : null;
}

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const data = await storefrontMutate<{
    cartCreate: { cart: unknown; userErrors: { field: string[] | null; message: string }[] };
  }>(
    /* GraphQL */ `
      mutation CartCreate($lines: [CartLineInput!]) {
        cartCreate(input: { lines: $lines }) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    { lines },
  );
  throwOnUserErrors(data.cartCreate.userErrors);
  return mapCart(data.cartCreate.cart);
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const data = await storefrontMutate<{
    cartLinesAdd: { cart: unknown; userErrors: { field: string[] | null; message: string }[] };
  }>(
    /* GraphQL */ `
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    { cartId, lines },
  );
  throwOnUserErrors(data.cartLinesAdd.userErrors);
  return mapCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<Cart> {
  const data = await storefrontMutate<{
    cartLinesUpdate: { cart: unknown; userErrors: { field: string[] | null; message: string }[] };
  }>(
    /* GraphQL */ `
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    { cartId, lines: [{ id: lineId, quantity }] },
  );
  throwOnUserErrors(data.cartLinesUpdate.userErrors);
  return mapCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await storefrontMutate<{
    cartLinesRemove: { cart: unknown; userErrors: { field: string[] | null; message: string }[] };
  }>(
    /* GraphQL */ `
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    { cartId, lineIds },
  );
  throwOnUserErrors(data.cartLinesRemove.userErrors);
  return mapCart(data.cartLinesRemove.cart);
}
