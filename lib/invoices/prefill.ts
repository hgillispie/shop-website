// Best-effort split of the intake form's single "Year, Make & Model" field
// (e.g. "1978 Harley-Davidson Shovelhead", see components/booking/
// IntakeForm.tsx) into the invoice's three separate vehicle fields. Always
// produces *something* reasonable even for an unusual format — the owner
// can hand-correct in the invoice form afterward, which is the expected
// path, not a failure case.
export function splitBikeYearMakeModel(input: string): {
  year: string;
  make: string;
  model: string;
} {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  const hasYear = /^\d{4}$/.test(parts[0] ?? "");
  const year = hasYear ? parts[0] : "";
  const rest = hasYear ? parts.slice(1) : parts;
  const make = rest[0] ?? "";
  const model = rest.slice(1).join(" ");
  return { year, make, model };
}

// What app/admin/(dashboard)/invoices/new/page.tsx hands to InvoiceForm
// when arriving via a Board job's "Create Invoice" link — distinct from
// the `invoice` prop (which is for *editing* an already-saved invoice).
export type InvoicePrefill = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  jobDescription: string;
};
