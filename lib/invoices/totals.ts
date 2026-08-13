// Pure, no imports — safe to use from both the client (live-updating the
// totals as the owner types) and the server (the authoritative snapshot
// written to serviceInvoices.*Cents on every save). Mirrors the spirit of
// lib/store/variants.ts: shared logic that doesn't belong to one side only.

type PartsLine = { qty: number; unitPriceCents: number };
type Job = { laborCents: number; parts: PartsLine[] };

export function lineTotalCents(part: PartsLine): number {
  return part.qty * part.unitPriceCents;
}

export function jobPartsTotalCents(job: { parts: PartsLine[] }): number {
  return job.parts.reduce((sum, part) => sum + lineTotalCents(part), 0);
}

export function jobTotalCents(job: Job): number {
  return jobPartsTotalCents(job) + job.laborCents;
}

export type InvoiceTotals = {
  partsTotalCents: number;
  laborTotalCents: number;
  taxCents: number;
  ccFeeCents: number;
  totalDueCents: number;
};

export function computeInvoiceTotals(input: {
  jobs: Job[];
  taxRatePercent: number;
  taxAppliesToParts: boolean;
  taxAppliesToLabor: boolean;
  ccFeeEnabled: boolean;
  ccFeeRatePercent: number;
}): InvoiceTotals {
  const partsTotalCents = input.jobs.reduce((sum, job) => sum + jobPartsTotalCents(job), 0);
  const laborTotalCents = input.jobs.reduce((sum, job) => sum + job.laborCents, 0);

  const taxableCents =
    (input.taxAppliesToParts ? partsTotalCents : 0) +
    (input.taxAppliesToLabor ? laborTotalCents : 0);
  const taxCents = Math.round((taxableCents * input.taxRatePercent) / 100);

  // CC fee, when enabled, is charged on the full amount that would actually
  // run through the card — after tax, not before.
  const preFeeCents = partsTotalCents + laborTotalCents + taxCents;
  const ccFeeCents = input.ccFeeEnabled
    ? Math.round((preFeeCents * input.ccFeeRatePercent) / 100)
    : 0;

  const totalDueCents = preFeeCents + ccFeeCents;

  return { partsTotalCents, laborTotalCents, taxCents, ccFeeCents, totalDueCents };
}
