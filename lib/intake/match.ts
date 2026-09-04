export type NameMatchCandidate = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export function normalizePersonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function nameMatchScore(extracted: string, customerName: string): number {
  const a = normalizePersonName(extracted);
  const b = normalizePersonName(customerName);
  if (!a || !b) return 0;
  if (a === b) return 100;

  const aParts = a.split(" ").filter(Boolean);
  const bParts = b.split(" ").filter(Boolean);
  const aLast = aParts.at(-1);
  const bLast = bParts.at(-1);

  if (aParts.length >= 2 && bParts.length >= 2 && aLast && bLast && aLast === bLast) {
    if (aParts[0] === bParts[0]) return 95;
    if (aParts.every((part) => bParts.includes(part)) || bParts.every((part) => aParts.includes(part))) {
      return 90;
    }
    if (aParts[0]?.[0] && aParts[0][0] === bParts[0]?.[0]) return 80;
    return 55;
  }

  if (aParts.length === 1 && bParts[0] === aParts[0]) return 70;
  if (bParts.length === 1 && aParts[0] === bParts[0]) return 70;
  if (a.length >= 4 && (b.includes(a) || a.includes(b))) return 65;
  return 0;
}

export function pickCustomerByName(
  extractedName: string | null | undefined,
  customers: NameMatchCandidate[],
): { customer: NameMatchCandidate; score: number } | null {
  if (!extractedName) return null;
  const scored = customers
    .map((customer) => ({ customer, score: nameMatchScore(extractedName, customer.name) }))
    .filter((row) => row.score >= 80)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  const top = scored[0];
  const ties = scored.filter((row) => row.score === top.score);
  if (ties.length > 1) return null;
  return top;
}
