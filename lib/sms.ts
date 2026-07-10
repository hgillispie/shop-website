import twilio from "twilio";
import { siteConfig } from "@/data/site-config";
import type { AppointmentRequestRow, JobRow } from "@/lib/db/schema";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const OWNER_PHONE = process.env.OWNER_PHONE;

// Twilio supports two credential shapes: the account's main Auth Token, or a
// scoped API Key (SID + Secret) — the latter still needs the Account SID
// passed separately since it isn't derivable from the API Key itself.
function createClient() {
  if (!ACCOUNT_SID) return null;
  if (API_KEY_SID && API_KEY_SECRET) {
    return twilio(API_KEY_SID, API_KEY_SECRET, { accountSid: ACCOUNT_SID });
  }
  if (AUTH_TOKEN) {
    return twilio(ACCOUNT_SID, AUTH_TOKEN);
  }
  return null;
}

const client = createClient();

export async function sendOwnerNewRequestSms(request: AppointmentRequestRow) {
  if (!client || !FROM_NUMBER || !OWNER_PHONE) {
    console.warn("[sms] Twilio not fully configured — skipping owner SMS.");
    return;
  }

  await client.messages.create({
    from: FROM_NUMBER,
    to: OWNER_PHONE,
    body: `New request: ${request.name} — ${request.bikeYearMakeModel} (${request.engineType}). Check the dashboard to review.`,
  });
}

export async function sendCustomerApprovalSms(
  request: AppointmentRequestRow,
  job: JobRow,
) {
  if (!client || !FROM_NUMBER) {
    console.warn("[sms] Twilio not fully configured — skipping customer SMS.");
    return;
  }

  const dropoff = job.dropoffAt
    ? job.dropoffAt.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "a time we'll confirm shortly";

  await client.messages.create({
    from: FROM_NUMBER,
    to: request.phone,
    body: `${siteConfig.shopName}: your appointment is confirmed for ${dropoff}. Drop off at ${siteConfig.address}. Questions? Call ${siteConfig.phone}.`,
  });
}
