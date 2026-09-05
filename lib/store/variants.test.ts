import assert from "node:assert/strict";
import test from "node:test";
import type { Product, ProductVariant } from "../shopify/types.ts";
import {
  defaultSelectedOptions,
  findAvailableVariant,
  selectOption,
  valuesForOption,
} from "./variants.ts";

function money(amount: string) {
  return { amount, currencyCode: "USD" };
}

function variant(
  title: string,
  color: string,
  size: string,
  availableForSale = true,
  price = "42.47",
): ProductVariant {
  return {
    id: `gid://shopify/ProductVariant/${title.replaceAll(" ", "-")}`,
    title,
    availableForSale,
    price: money(price),
    selectedOptions: [
      { name: "Color", value: color },
      { name: "Size", value: size },
    ],
    image: null,
  };
}

// Live Bagger Pocket Tee (handle flash-pocket-tee): White/S was never
// published. First listed option combo is White+S, which does not exist.
function baggerPocketTee(overrides: Partial<Product> = {}): Product {
  return {
    id: "gid://shopify/Product/flash",
    handle: "flash-pocket-tee",
    title: "Bagger Pocket Tee",
    description: "",
    images: [],
    priceRange: { min: money("42.47"), max: money("47.35") },
    options: [
      { name: "Color", values: ["White", "Black"] },
      { name: "Size", values: ["S", "M", "L", "XL", "2XL"] },
    ],
    variants: [
      variant("Black / S", "Black", "S"),
      variant("Black / M", "Black", "M"),
      variant("White / M", "White", "M"),
      variant("Black / L", "Black", "L"),
      variant("White / L", "White", "L"),
      variant("Black / XL", "Black", "XL"),
      variant("White / XL", "White", "XL"),
      variant("Black / 2XL", "Black", "2XL", true, "47.35"),
      variant("White / 2XL", "White", "2XL", true, "47.35"),
    ],
    ...overrides,
  };
}

test("defaults to the first available variant, not White/S", () => {
  const product = baggerPocketTee();
  const selected = defaultSelectedOptions(product);
  assert.deepEqual(selected, { Color: "Black", Size: "S" });
  const matched = findAvailableVariant(product, selected);
  assert.ok(matched);
  assert.equal(matched.title, "Black / S");
});

test("White only offers M–2XL; Black offers S–2XL", () => {
  const product = baggerPocketTee();
  assert.deepEqual(valuesForOption(product, "Color", { Color: "Black", Size: "S" }), [
    "White",
    "Black",
  ]);
  assert.deepEqual(valuesForOption(product, "Size", { Color: "White", Size: "M" }), [
    "M",
    "L",
    "XL",
    "2XL",
  ]);
  assert.deepEqual(valuesForOption(product, "Size", { Color: "Black", Size: "S" }), [
    "S",
    "M",
    "L",
    "XL",
    "2XL",
  ]);
});

test("switching to White from Black/S lands on White/M", () => {
  const product = baggerPocketTee();
  const next = selectOption(product, { Color: "Black", Size: "S" }, "Color", "White");
  assert.deepEqual(next, { Color: "White", Size: "M" });
  assert.equal(findAvailableVariant(product, next)?.title, "White / M");
});

test("switching colors keeps a size that is still available", () => {
  const product = baggerPocketTee();
  const next = selectOption(product, { Color: "White", Size: "L" }, "Color", "Black");
  assert.deepEqual(next, { Color: "Black", Size: "L" });
});

test("sold-out variants are not offered", () => {
  const product = baggerPocketTee({
    variants: [
      variant("Black / S", "Black", "S"),
      variant("Black / M", "Black", "M", false),
      variant("White / M", "White", "M"),
    ],
  });
  assert.deepEqual(valuesForOption(product, "Size", { Color: "Black", Size: "S" }), ["S"]);
  const next = selectOption(product, { Color: "White", Size: "M" }, "Color", "Black");
  assert.deepEqual(next, { Color: "Black", Size: "S" });
});

test("defaults to first variant when everything is sold out", () => {
  const product = baggerPocketTee({
    variants: [variant("Black / S", "Black", "S", false), variant("White / M", "White", "M", false)],
  });
  assert.deepEqual(defaultSelectedOptions(product), { Color: "Black", Size: "S" });
  assert.equal(findAvailableVariant(product, defaultSelectedOptions(product)), null);
});
