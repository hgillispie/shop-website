// Cents everywhere in storage/pricing logic — this is the one place that
// turns that into a display string.
export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
