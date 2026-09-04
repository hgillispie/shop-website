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
    sentimentScore: coerceSentimentScore(obj.sentimentScore ?? obj.sentiment),
    positiveQuotes: coerceQuoteList(obj.positiveQuotes ?? obj.quotes),
    negativeQuotes: coerceQuoteList(obj.negativeQuotes),
    ownerBrief: str("ownerBrief") ?? str("brief") ?? str("analysis"),
    recommendedNextStep: str("recommendedNextStep") ?? str("nextStep"),
    urgency: coerceUrgency(obj.urgency),
    missingInfo: coerceStringList(obj.missingInfo ?? obj.missing),
    matchedFromCrm: obj.matchedFromCrm === true,
  };
}

export function normalizeQuote(quote: string): string {
  return quote
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isUsableQuote(quote: string): boolean {
  const cleaned = quote.replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return cleaned.length >= 16 && words.length >= 4;
}

export function coerceSentimentScore(value: unknown): number | null {
  if (typeof value === "string" && /^(positive|happy|good)$/i.test(value.trim())) return 80;
  if (typeof value === "string" && /^(negative|unhappy|bad)$/i.test(value.trim())) return 25;
  if (typeof value === "string" && /^(neutral|mixed)$/i.test(value.trim())) return 50;
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return null;
  const scaled = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric;
  return Math.round(Math.min(100, Math.max(0, scaled)));
}

export function coerceQuoteList(value: unknown): string[] {
  const items = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const quotes: string[] = [];
  for (const item of items) {
    const raw = blankToNull(typeof item === "string" ? item : undefined);
    if (!raw || !isUsableQuote(raw)) continue;
    const cleaned = raw.replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "").trim();
    const key = normalizeQuote(cleaned);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    quotes.push(cleaned.length > 280 ? `${cleaned.slice(0, 279).trimEnd()}…` : cleaned);
    if (quotes.length >= 8) break;
  }
  return quotes;
}

export function mergeQuoteLists(...lists: Array<string[] | null | undefined>): string[] {
  return coerceQuoteList(lists.flatMap((list) => list ?? []));
}

export function coerceUrgency(value: unknown): IntakeExtraction["urgency"] {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "low" || raw === "normal" || raw === "high") return raw;
  if (raw === "medium" || raw === "med") return "normal";
  if (raw === "urgent" || raw === "asap") return "high";
  return null;
}

export function coerceStringList(value: unknown, max = 8): string[] {
  const items = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
  const out: string[] = [];
  for (const item of items) {
    const text = blankToNull(typeof item === "string" ? item : undefined);
    if (!text) continue;
    out.push(text.length > 120 ? `${text.slice(0, 119).trimEnd()}…` : text);
    if (out.length >= max) break;
  }
  return out;
}

const YES = /^(y|yes|yeah|yep|correct|that'?s (them|him|her|it)|use that)$/i;

export function isAffirmativeReply(text: string): boolean {
  return YES.test(text.trim());
}

export function parseOwnerContactReply(text: string): {
  phone: string | null;
  email: string | null;
  acceptedMatch: boolean;
} {
  const trimmed = text.trim();
  const emailMatch = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return {
    phone: firstUsablePhone(trimmed),
    email: emailMatch?.[0]?.toLowerCase() ?? null,
    acceptedMatch: isAffirmativeReply(trimmed),
  };
}

function firstUsablePhone(text: string): string | null {
  const candidates = text.match(
    /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}|\+?\d{10,15}/g,
  );
  if (!candidates) return null;
  for (const raw of candidates) {
    if (isUsablePhone(raw)) return raw;
  }
  return null;
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
  ownerBrief?: string | null;
  workNeeded: string | null;
  conversationSummary: string | null;
  bodyText: string | null;
}): string {
  return (
    input.ownerBrief ||
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
