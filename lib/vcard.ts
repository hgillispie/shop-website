/** Short public path iPhone Camera / NFC should open. Must end in `.vcf`. */
export const VCARD_PATH = "/c.vcf";
export const VCARD_FILENAME = "swafford-speed.vcf";

/** Printed QR / NFC target — the live shop host, not a preview or localhost. */
export const CANONICAL_SITE_URL = "https://swaffordspeed.com";
export const CANONICAL_VCARD_URL = `${CANONICAL_SITE_URL}${VCARD_PATH}`;

/**
 * Confirmed public contact. ZIP comes from `siteConfig.address`
 * (`529 E Darby Road, Taylors, SC 29687`) — not invented.
 */
export const shopContact = {
  givenName: "Matt",
  familyName: "Daves",
  formattedName: "Matt Daves",
  organization: "Swafford Speed",
  tel: "+18646669451",
  email: "swaffordspeed@gmail.com",
  url: CANONICAL_SITE_URL,
  street: "529 E Darby Road",
  locality: "Taylors",
  region: "SC",
  postalCode: "29687",
  country: "US",
  note: "Harley-Davidson performance & custom shop, Upstate SC",
} as const;

export const shopContactAddressLine = [
  shopContact.street,
  `${shopContact.locality}, ${shopContact.region} ${shopContact.postalCode}`,
].join(", ");

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

export function buildShopVcard(): string {
  const c = shopContact;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Swafford Speed//Contact//EN",
    `FN:${escapeVcard(c.formattedName)}`,
    `N:${escapeVcard(c.familyName)};${escapeVcard(c.givenName)};;;`,
    `ORG:${escapeVcard(c.organization)}`,
    `TEL;TYPE=WORK,VOICE:${c.tel}`,
    `EMAIL;TYPE=WORK:${c.email}`,
    `URL:${c.url}`,
    `ADR;TYPE=WORK:;;${escapeVcard(c.street)};${escapeVcard(c.locality)};${escapeVcard(c.region)};${c.postalCode};${c.country}`,
    `NOTE:${escapeVcard(c.note)}`,
    "END:VCARD",
  ];

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export const VCARD_HEADERS = {
  "Content-Type": "text/vcard; charset=utf-8",
  "Content-Disposition": `inline; filename="${VCARD_FILENAME}"`,
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
} as const;
