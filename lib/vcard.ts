/** Short public path iPhone Camera / NFC should open. Must end in `.vcf`. */
export const VCARD_PATH = "/c.vcf";
export const VCARD_FILENAME = "swafford-speed.vcf";

/** Printed QR / NFC target — the live shop host, not a preview or localhost. */
export const CANONICAL_SITE_URL = "https://swaffordspeed.com";
export const CANONICAL_VCARD_URL = `${CANONICAL_SITE_URL}${VCARD_PATH}`;

// Public-only fields, kept in lockstep with `data/site-config.ts` (the
// vCard test fails if shopName / email / phoneHref drift). Do not add
// `siteConfig.address` — that drop-off street is private (no walk-ins).
const SHOP_NAME = "Swafford Speed";
const WORK_TEL = "+18646669451";
const WORK_EMAIL = "swaffordspeed@gmail.com";

function escapeVcard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** vCard 3.0 folds at 75 octets; continuation lines start with a space. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
}

/**
 * Organization vCard for the shop. Includes fields that are already public
 * on the site (email, city). Omits `siteConfig.address` on purpose — that
 * drop-off street is private (no walk-ins) and must not go on a printed QR.
 */
export function buildShopVcard(): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Swafford Speed//Contact//EN",
    `FN:${escapeVcard(SHOP_NAME)}`,
    `ORG:${escapeVcard(SHOP_NAME)}`,
    "X-ABShowAs:COMPANY",
    `TEL;TYPE=WORK,VOICE:${WORK_TEL}`,
    `EMAIL;TYPE=WORK:${WORK_EMAIL}`,
    `URL:${CANONICAL_SITE_URL}`,
    "ADR;TYPE=WORK:;;;Taylors;SC;;US",
    `NOTE:${escapeVcard("Harley-Davidson performance & custom shop, Upstate SC")}`,
    "END:VCARD",
  ];

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export const VCARD_HEADERS = {
  "Content-Type": "text/vcard; charset=utf-8",
  "Content-Disposition": `inline; filename="${VCARD_FILENAME}"`,
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
} as const;
