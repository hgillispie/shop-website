import type { PrintifyOption, PrintifyVariant } from "@/lib/printify";

// Deliberately NOT in lib/printify.ts — that file is server-only, and this
// needs to be callable from client components (color/size pickers, the
// photo gallery). It only imports *types* from lib/printify, which get
// erased at compile time, so no server-only code ends up in the client
// bundle.

/**
 * Resolves the value a variant holds for a given option — e.g. "which
 * color id does this variant have" — by checking which of the variant's
 * option-value ids is actually a member of that option's own value set,
 * rather than reading variant.options[index] positionally. Confirmed
 * against this shop's real catalog that position isn't reliable: the same
 * product can have some variants ordered [color, size] and others
 * [size, color]. Returns undefined if this variant doesn't have a value
 * for that option at all.
 */
export function variantValueFor(
  variant: PrintifyVariant,
  option: PrintifyOption,
): number | undefined {
  const valueIds = new Set(option.values.map((v) => v.id));
  return variant.options.find((id) => valueIds.has(id));
}
