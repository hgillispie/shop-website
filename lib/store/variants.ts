import type { Product, ProductVariant } from "@/lib/shopify/types";

export function variantMatches(
  variant: ProductVariant,
  selected: Record<string, string>,
): boolean {
  return variant.selectedOptions.every((opt) => selected[opt.name] === opt.value);
}

export function optionsFromVariant(variant: ProductVariant): Record<string, string> {
  return Object.fromEntries(variant.selectedOptions.map((opt) => [opt.name, opt.value]));
}

export function availableVariants(product: Product): ProductVariant[] {
  return product.variants.filter((variant) => variant.availableForSale);
}

export function findVariant(
  product: Product,
  selected: Record<string, string>,
): ProductVariant | null {
  return product.variants.find((variant) => variantMatches(variant, selected)) ?? null;
}

export function findAvailableVariant(
  product: Product,
  selected: Record<string, string>,
): ProductVariant | null {
  const variant = findVariant(product, selected);
  return variant?.availableForSale ? variant : null;
}

// First availableForSale variant in Shopify's listing order — not the
// cartesian first option combo, which may not exist (White/S on the
// Bagger Pocket Tee is the live example).
export function defaultSelectedOptions(product: Product): Record<string, string> {
  const firstAvailable = product.variants.find((variant) => variant.availableForSale);
  if (firstAvailable) return optionsFromVariant(firstAvailable);

  const first = product.variants[0];
  if (first) return optionsFromVariant(first);

  return Object.fromEntries(
    product.options.map((option) => [option.name, option.values[0] ?? ""]),
  );
}

function matchesEarlierOptions(
  variant: ProductVariant,
  optionName: string,
  selected: Record<string, string>,
  optionNames: string[],
): boolean {
  const optionIndex = optionNames.indexOf(optionName);
  const earlier = optionNames.slice(0, Math.max(optionIndex, 0));
  return earlier.every((name) =>
    variant.selectedOptions.some((opt) => opt.name === name && opt.value === selected[name]),
  );
}

// Values that exist on an available variant, filtered by options listed
// earlier (Color filters Size; Size does not hide Color). Preserves the
// product.options value order from Shopify.
export function valuesForOption(
  product: Product,
  optionName: string,
  selected: Record<string, string>,
): string[] {
  const optionNames = product.options.map((option) => option.name);
  const declared = product.options.find((option) => option.name === optionName)?.values ?? [];
  const offered = new Set<string>();

  for (const variant of product.variants) {
    if (!variant.availableForSale) continue;
    if (!matchesEarlierOptions(variant, optionName, selected, optionNames)) continue;
    const match = variant.selectedOptions.find((opt) => opt.name === optionName);
    if (match) offered.add(match.value);
  }

  return declared.filter((value) => offered.has(value));
}

// Keep the newly picked value and as many of the previous selections as
// possible; if that combo is missing or sold out, snap the rest to the
// first available variant that includes the new value.
export function selectOption(
  product: Product,
  selected: Record<string, string>,
  optionName: string,
  value: string,
): Record<string, string> {
  const next = { ...selected, [optionName]: value };
  if (findAvailableVariant(product, next)) return next;

  const candidates = product.variants.filter(
    (variant) =>
      variant.availableForSale &&
      variant.selectedOptions.some((opt) => opt.name === optionName && opt.value === value),
  );
  if (candidates.length === 0) return next;

  candidates.sort((a, b) => {
    const score = (variant: ProductVariant) =>
      variant.selectedOptions.filter(
        (opt) => opt.name !== optionName && selected[opt.name] === opt.value,
      ).length;
    return score(b) - score(a);
  });

  return optionsFromVariant(candidates[0]);
}
