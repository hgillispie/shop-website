import type { IntakeExtraction } from "@/lib/db/schema";

const PLACEHOLDER = /^(n\/a|na|none|unknown|null|undefined|-|tbd)$/i;

export function blankToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || PLACEHOLDER.test(trimmed)) return null;
  return trimmed;
}

export function extractEmailAddress(from: string): string {
  const angle = from.match(/<([^>]+)>/);
  return (angle?.[1] ?? from).trim().toLowerCase();
}

export function parseFromHeader(from: string): { name: string | null; email: string } {
  const email = extractEmailAddress(from);
  const nameMatch = from.match(/^\s*"?([^"<]+?)"?\s*</);
  const name = blankToNull(nameMatch?.[1]);
  return { name, email };
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function allowedIntakeSenders(): string[] | null {
  const extra = (process.env.INTAKE_ALLOWED_SENDERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const list = [...extra, ...(owner ? [owner] : [])];
  if (list.includes("*")) return null;
  return list.length > 0 ? list : null;
}

export function isAllowedIntakeSender(from: string): boolean {
  const allowlist = allowedIntakeSenders();
  if (!allowlist) return true;
  return allowlist.includes(extractEmailAddress(from));
}

export function parseTelegramUserIds(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAllowedTelegramUser(
  userId: number,
  raw = process.env.TELEGRAM_ALLOWED_USER_IDS ?? "",
): boolean {
  const ids = parseTelegramUserIds(raw);
  if (ids.length === 0) return true;
  return ids.includes(String(userId));
}

export function isUsablePhone(phone: string | null | undefined): phone is string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function coerceExtraction(raw: unknown): IntakeExtraction {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (key: string) =>
    blankToNull(typeof obj[key] === "string" ? obj[key] : undefined);

  return {
    customerName: str("customerName") ?? str("name"),
    phone: str("phone") ?? str("customerPhone"),
    email: str("email") ?? str("customerEmail"),
    bikeYearMakeModel: str("bikeYearMakeModel") ?? str("bike"),
    workNeeded: str("workNeeded") ?? str("work"),
    conversationSummary: str("conversationSummary") ?? str("summary"),
  };
}

export function draftJobTitle(input: {
  bikeYearMakeModel: string | null;
  customerName: string | null;
  subject: string | null;
}): string {
  const bike = input.bikeYearMakeModel;
  const name = input.customerName;
  if (bike && name) return `${name} — ${bike}`;
  if (bike) return bike;
  if (name) return name;
  const subject = blankToNull(input.subject);
  return subject || "Screenshot intake";
}

export function draftJobDescription(input: {
  workNeeded: string | null;
  conversationSummary: string | null;
  bodyText: string | null;
}): string {
  return (
    input.workNeeded ||
    input.conversationSummary ||
    blankToNull(input.bodyText)?.slice(0, 2000) ||
    "No details extracted yet — open this card to review the screenshots."
  );
}

export const INTAKE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isIntakeImageType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return INTAKE_IMAGE_TYPES.has(type);
}
