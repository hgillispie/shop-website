// Registers (or rotates) the Telegram bot webhook to this app's intake
// endpoint. Usage:
//   node scripts/register-telegram-webhook.mjs https://swaffordspeed.com
// Needs TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET in env / .env.local.

import { config } from "dotenv";
config({ path: ".env.local" });

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const baseUrl = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set.");
  process.exit(1);
}
if (!secret) {
  console.error("TELEGRAM_WEBHOOK_SECRET is not set. Generate one with: openssl rand -hex 24");
  process.exit(1);
}
if (!baseUrl || baseUrl.includes("localhost")) {
  console.error(
    "Pass a public HTTPS base URL: node scripts/register-telegram-webhook.mjs https://your-domain",
  );
  process.exit(1);
}

const url = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: false,
  }),
});
const json = await response.json();
if (!json.ok) {
  console.error("FAILED:", json);
  process.exit(1);
}
console.log("SUCCESS — Telegram webhook set to", url);
