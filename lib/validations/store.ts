import { z } from "zod";

// Bounded quantity — this is the shape the client sends; prices are never
// trusted from here, only product/variant identity and how many.
export const cartLineItemSchema = z.object({
  printifyProductId: z.string().trim().min(1),
  printifyVariantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20, "Max 20 per item."),
});

export type CartLineItem = z.infer<typeof cartLineItemSchema>;

// The normalized shape stored on storeOrders.shippingAddress and passed to
// Printify's address_to — kept distinct from whatever shape a given
// front-end collects it in (see toShippingAddress below for the Stripe
// AddressElement -> this mapping).
export const shippingAddressSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.string().trim().min(1, "Enter a last name."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Enter a valid phone number."),
  country: z.string().trim().length(2, "Use a 2-letter country code, e.g. US."),
  region: z.string().trim().min(1, "Enter a state/region."),
  address1: z.string().trim().min(1, "Enter a street address."),
  address2: z.string().trim().optional(),
  city: z.string().trim().min(1, "Enter a city."),
  zip: z.string().trim().min(1, "Enter a ZIP/postal code."),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// POST /api/store/checkout/start — creates the order draft the moment
// someone reaches checkout, before email or address are known (priced on
// subtotal only). This is deliberate, not a half-finished version of the
// old single-step flow: mounting the PaymentIntent this early is what lets
// the Address/Payment Elements render immediately, which is what lets Link
// recognize a returning customer by email before they've typed anything
// else. See updateCheckoutDetailsSchema for where shipping gets added once
// the address is known.
export const startCheckoutSchema = z.object({
  lineItems: z.array(cartLineItemSchema).min(1, "Your cart is empty."),
});

// POST /api/store/checkout/update-details — fired once the customer has
// typed an email (LinkAuthenticationElement) and a complete shipping
// address (AddressElement). This is the shape Stripe's AddressElement
// change event hands back, not our own normalized ShippingAddress — see
// toShippingAddress below for the conversion.
export const updateCheckoutDetailsSchema = z.object({
  orderRef: z.string().trim().min(1),
  email: z.string().trim().email("Enter a valid email address."),
  name: z.string().trim().min(1, "Enter your name."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Enter a valid phone number."),
  address: z.object({
    line1: z.string().trim().min(1, "Enter a street address."),
    line2: z.string().trim().nullable().optional(),
    city: z.string().trim().min(1, "Enter a city."),
    state: z.string().trim().min(1, "Enter a state/region."),
    postal_code: z.string().trim().min(1, "Enter a ZIP/postal code."),
    country: z.string().trim().length(2, "Use a 2-letter country code, e.g. US."),
  }),
});

export type UpdateCheckoutDetailsInput = z.infer<typeof updateCheckoutDetailsSchema>;

/**
 * Stripe's AddressElement collects one combined `name` field, not
 * first/last separately — split on the first space. A single-word name
 * (rare, but real) reuses that word for both rather than leaving either
 * half blank, since Printify's address_to expects both to be non-empty.
 */
export function toShippingAddress(input: UpdateCheckoutDetailsInput): ShippingAddress {
  const trimmed = input.name.trim().replace(/\s+/g, " ");
  const spaceIndex = trimmed.indexOf(" ");
  const firstName = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
  const lastName = spaceIndex === -1 ? trimmed : trimmed.slice(spaceIndex + 1);

  return {
    firstName,
    lastName,
    phone: input.phone,
    country: input.address.country,
    region: input.address.state,
    address1: input.address.line1,
    address2: input.address.line2 ?? undefined,
    city: input.address.city,
    zip: input.address.postal_code,
  };
}

// Admin Terminal — a manually-entered charge (service appointments, mostly),
// as opposed to ringing up real Printify merch. $0.50 mirrors Stripe's own
// card-payment minimum, so a bad amount fails here with a clear message
// rather than a less friendly error from Stripe later. $10,000 is a sanity
// ceiling against a fat-fingered extra digit, not a real business limit —
// raise it if a real charge ever needs to clear it.
export const manualChargeSchema = z.object({
  priceCents: z
    .number()
    .int()
    .min(50, "Minimum charge is $0.50.")
    .max(1_000_000, "Max $10,000 per charge — split larger amounts into more than one."),
  memo: z.string().trim().min(1, "Enter a description.").max(200),
});

export type ManualCharge = z.infer<typeof manualChargeSchema>;

// Admin Terminal's "current sale" can mix real Printify merch with manual
// service charges in one swipe (e.g. an oil change plus a shirt) — each
// line says which kind it is so the order-creation action knows whether to
// re-price it against the live catalog (merch) or trust the amount as-is
// (manual — there's no catalog to check it against; the admin typing it in
// already passed the session check, unlike an anonymous storefront client).
export const inPersonLineItemSchema = z.discriminatedUnion("kind", [
  cartLineItemSchema.extend({ kind: z.literal("merch") }),
  manualChargeSchema.extend({ kind: z.literal("manual") }),
]);

export type InPersonLineItem = z.infer<typeof inPersonLineItemSchema>;
