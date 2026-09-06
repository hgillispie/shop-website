export const SITE_NAME = "Swafford Speed";

export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

/** Root / fallback title. Homepage uses `homeTitle` (same string, via the template). */
export const defaultTitle = "Harley Custom & Chopper Repair in Upstate SC";

export const defaultDescription =
  "Independent Harley shop in Taylors / Upstate SC. Chopper repair and custom builds, club-style and bagger work, V-twin service. Appointment only — no walk-ins.";

export const homeTitle = defaultTitle;

export const homeDescription = defaultDescription;

export const aboutTitle = "About — Choppers, Customs & Harley Repair";

export const aboutDescription =
  "Who works on your bike at Swafford Speed in Taylors, SC. Club-style and chopper builds, vintage through Milwaukee-Eight, performance and motorcycle repair. Independent shop, appointment only.";

export const keywords = [
  "chopper repair Upstate SC",
  "custom chopper Greenville SC",
  "Harley repair Taylors SC",
  "custom Harley build Upstate",
  "club style Harley Greenville",
  "bagger performance South Carolina",
  "motorcycle mechanic Upstate SC",
  "V-twin shop Taylors",
  "Harley-Davidson performance shop Taylors SC",
] as const;

export const businessJsonLdDescription =
  "Independent Harley-Davidson performance and custom shop serving Taylors, Greenville, and the Upstate of South Carolina. Chopper repair and builds, club-style and bagger work, V-twin service. Appointment only. No walk-ins.";
