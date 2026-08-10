import { z } from "zod";

// Bounded quantity — this is the shape the client sends; prices are never
// trusted from here, only product/variant identity and how many.
export const cartLineItemSchema = z.object({
  printifyProductId: z.string().trim().min(1),
  printifyVariantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20, "Max 20 per item."),
});

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

// POST /api/store/orders — creating the order draft before payment.
export const createOrderSchema = z.object({
  lineItems: z.array(cartLineItemSchema).min(1, "Your cart is empty."),
  shippingAddress: shippingAddressSchema,
  email: z.string().trim().email("Enter a valid email address."),
});

export type CartLineItem = z.infer<typeof cartLineItemSchema>;
