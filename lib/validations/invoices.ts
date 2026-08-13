import { z } from "zod";

// Service invoices (the printed repair-order/receipt for bike work) are a
// standalone tree — invoice -> jobs -> parts lines — filled in by hand for
// whoever's in front of the counter, same spirit as the Terminal's
// manual-entry flow. See lib/db/schema.ts's serviceInvoices for why this is
// deliberately not linked to `customers`/`jobs`.

export const invoicePartsLineSchema = z.object({
  // Present when editing a line that already exists in the DB — absent for
  // a line the owner just added client-side. The action uses this to tell
  // "already had an id" apart from "brand new" when logging, though both
  // are written the same way (delete-and-reinsert — see actions.ts).
  id: z.string().optional(),
  description: z.string().trim().max(200).default(""),
  qty: z.number().int().min(1, "Qty must be at least 1.").max(999).default(1),
  // A sanity ceiling against a fat-fingered extra digit, not a real
  // business limit — same posture as manualChargeSchema in store.ts.
  unitPriceCents: z.number().int().min(0).max(10_000_000).default(0),
});

export type InvoicePartsLineInput = z.infer<typeof invoicePartsLineSchema>;

export const invoiceJobSchema = z.object({
  id: z.string().optional(),
  techInitials: z.string().trim().max(10).default(""),
  customerDescription: z.string().trim().max(2000).default(""),
  technicianFindings: z.string().trim().max(2000).default(""),
  correctionPerformed: z.string().trim().max(2000).default(""),
  // Flat-rate labor, hand-typed by the owner — not itemized by hours.
  laborCents: z.number().int().min(0).max(10_000_000).default(0),
  parts: z.array(invoicePartsLineSchema).default([]),
});

export type InvoiceJobInput = z.infer<typeof invoiceJobSchema>;

export const invoiceSchema = z.object({
  serviceAdvisor: z.string().trim().max(100).default(""),
  dateWritten: z.coerce.date({ message: "Enter a valid date." }),
  customerName: z.string().trim().min(1, "Enter the customer's name."),
  customerAddress: z.string().trim().max(200).default(""),
  customerCityStateZip: z.string().trim().max(100).default(""),
  customerPhone: z.string().trim().max(30).default(""),
  // Not validated as a strict email — this is a hand-filled paper-form
  // stand-in, not a system-of-record contact used to send anything.
  customerEmail: z.string().trim().max(200).default(""),
  vehicleYear: z.string().trim().max(10).default(""),
  vehicleMake: z.string().trim().max(50).default(""),
  vehicleModel: z.string().trim().max(50).default(""),
  vehicleColor: z.string().trim().max(50).default(""),
  vehicleVin: z.string().trim().max(50).default(""),
  licensePlate: z.string().trim().max(20).default(""),
  mileageIn: z.string().trim().max(20).default(""),
  odometerOut: z.string().trim().max(20).default(""),
  // A manual rate the owner sets per invoice, not a fixed shop-wide config
  // value — real repair shops often tax parts but not standalone labor, so
  // which subtotal(s) it applies to is configurable too. Confirm the actual
  // treatment with an accountant/the SC DOR — this just lets the owner set
  // whatever they're told, per invoice, rather than hardcoding an assumption.
  taxRatePercent: z.number().min(0).max(100).default(0),
  taxAppliesToParts: z.boolean().default(true),
  taxAppliesToLabor: z.boolean().default(false),
  // Optional CC processing surcharge, off by default — computed on
  // (parts + labor + tax), i.e. the actual amount that would run through
  // the card. See computeInvoiceTotals in lib/invoices/totals.ts.
  ccFeeEnabled: z.boolean().default(false),
  ccFeeRatePercent: z.number().min(0).max(100).default(0),
  jobs: z.array(invoiceJobSchema).default([]),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
