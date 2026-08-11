// scripts/create-terminal-location.mjs
//
// One-time setup: creates a Stripe Terminal Location representing the
// shop's physical counter. Required before the Terminal reader — even the
// simulated one used in dev — will connect; discoverReaders/connectReader
// need a location id regardless of whether the reader is real.
//
// Usage: node scripts/create-terminal-location.mjs
//
// Env vars required (loaded from .env.local, same as drizzle.config.ts):
//   STRIPE_SECRET_KEY

import { config } from "dotenv";
config({ path: ".env.local" });

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY must be set in .env.local");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });

const location = await stripe.terminal.locations.create({
  display_name: "Swafford Speed",
  address: {
    line1: "529 E Darby Road",
    city: "Taylors",
    state: "SC",
    postal_code: "29687",
    country: "US",
  },
});

console.log("Created Terminal Location:");
console.log(`  id: ${location.id}`);
console.log(`  display_name: ${location.display_name}`);
console.log("");
console.log("Add this to .env.local:");
console.log(`STRIPE_TERMINAL_LOCATION_ID=${location.id}`);
