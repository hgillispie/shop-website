import "server-only";
import crypto from "node:crypto";

// See .claude/skills/shopify-api-auth for the full, verified auth story.
// Short version: this app has no static Admin API token. Every call needs
// a fresh access token from the OAuth client credentials grant, valid
// ~24h. Cached in memory (module scope) and refreshed a minute before it
// actually expires — on a cold serverless start this just misses and
// re-fetches once, which is fine.
const API_VERSION = "2025-10";

let cachedToken: { token: string; expiresAt: number } | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to .env.local.`);
  return value;
}

async function getAdminAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const domain = requireEnv("SHOPIFY_STORE_DOMAIN");
  const clientId = requireEnv("SHOPIFY_DEV_APP_CLIENT_ID");
  const clientSecret = requireEnv("SHOPIFY_DEV_APP_CLIENT_SECRET");

  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Shopify admin token exchange failed (${res.status})`);
  }

  const json = await res.json();
  cachedToken = {
    token: json.access_token,
    // Refresh a minute early rather than racing the exact expiry instant.
    expiresAt: now + (json.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

function throwOnUserErrors(userErrors: { field: string[] | null; message: string }[]) {
  if (userErrors && userErrors.length > 0) {
    throw new Error(userErrors.map((e) => e.message).join("; "));
  }
}

async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const domain = requireEnv("SHOPIFY_STORE_DOMAIN");
  const token = await getAdminAccessToken();

  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(
      `Shopify Admin API error (${res.status}): ${JSON.stringify(json.errors ?? json)}`,
    );
  }
  return json.data as T;
}

export type DraftOrderLineItem = {
  title: string;
  quantity: number;
  // Dollars, not cents — Shopify's Money/Decimal input wants a decimal string.
  price: string;
};

export type CreateDraftOrderInput = {
  email: string;
  // Free-text — repair customers aren't real Shopify customers, so this is
  // billing/shipping address as plain strings, not a customerId reference.
  billingAddress?: {
    address1?: string;
    city?: string;
    provinceCode?: string;
    zip?: string;
    countryCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  lineItems: DraftOrderLineItem[];
  note?: string;
  // repair-invoice + invoice:{id} — how the orders/paid webhook tells a
  // paid repair invoice apart from a paid merch order landing on the same
  // topic. Draft order tags carry over to the resulting Order on payment
  // (confirmed Shopify behavior), so this survives the whole flow.
  tags: string[];
};

// Parts and labor are represented as custom line items, never real
// product variants — none of this maps to actual Shopify inventory. Tax
// is computed by our own lib/invoices/totals.ts (the owner's manually-set
// rate), so the whole draft order is marked tax-exempt and tax/CC-fee are
// added as their own explicit line items instead of letting Shopify's tax
// engine calculate anything — avoids double-taxing entirely, the same
// failure mode Task 3's plan explicitly calls out for POS.
export async function createDraftOrder(
  input: CreateDraftOrderInput,
): Promise<{ id: string; invoiceUrl: string | null }> {
  const data = await adminFetch<{
    draftOrderCreate: {
      draftOrder: { id: string; invoiceUrl: string | null } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(
    /* GraphQL */ `
      mutation CreateDraftOrder($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            invoiceUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      input: {
        email: input.email,
        note: input.note,
        tags: input.tags,
        taxExempt: true,
        billingAddress: input.billingAddress,
        lineItems: input.lineItems.map((line) => ({
          title: line.title,
          quantity: line.quantity,
          originalUnitPrice: line.price,
          taxable: false,
        })),
      },
    },
  );

  throwOnUserErrors(data.draftOrderCreate.userErrors);
  if (!data.draftOrderCreate.draftOrder) {
    throw new Error("draftOrderCreate returned no draft order and no userErrors.");
  }
  return data.draftOrderCreate.draftOrder;
}

export async function sendDraftOrderInvoice(
  draftOrderId: string,
): Promise<{ invoiceUrl: string | null }> {
  const data = await adminFetch<{
    draftOrderInvoiceSend: {
      draftOrder: { invoiceUrl: string | null } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(
    /* GraphQL */ `
      mutation SendDraftOrderInvoice($id: ID!) {
        draftOrderInvoiceSend(id: $id) {
          draftOrder {
            invoiceUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    { id: draftOrderId },
  );

  throwOnUserErrors(data.draftOrderInvoiceSend.userErrors);
  return { invoiceUrl: data.draftOrderInvoiceSend.draftOrder?.invoiceUrl ?? null };
}

// Auto-publishing a Printify-synced product to the Headless channel the
// moment it's created — see app/api/shopify/webhooks/products-create/route.ts.
// The owner explicitly authorized this specific action (publish an
// already-Printify-synced product to Headless) without asking each time,
// given the store domain is unguessable and nothing's live/merged yet —
// unpublish/delete/price-change stay a separate, ask-first category.
export async function publishProductToHeadless(
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const publicationId = requireEnv("SHOPIFY_HEADLESS_PUBLICATION_ID");

  const data = await adminFetch<{
    publishablePublish: {
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(
    /* GraphQL */ `
      mutation PublishToHeadless($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          userErrors {
            field
            message
          }
        }
      }
    `,
    { id: productId, input: [{ publicationId }] },
  );

  const errors = data.publishablePublish.userErrors;
  if (errors.length > 0) {
    return { ok: false, error: errors.map((e) => e.message).join("; ") };
  }
  return { ok: true };
}

// Shopify signs the raw webhook body with the app's client secret
// (SHOPIFY_WEBHOOK_SECRET — same value, see .env.example) via HMAC-SHA256,
// base64-encoded, in the X-Shopify-Hmac-Sha256 header. Must run on the raw
// text body, before any JSON parsing — reparsing/reserializing changes the
// bytes and breaks the comparison even for a genuinely valid webhook.
export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !hmacHeader) return false;

  const computed = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  const a = Buffer.from(computed, "base64");
  const b = Buffer.from(hmacHeader, "base64");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
