export const SITE_NAME = "Swafford Speed";

export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

/** Root / fallback title. Homepage uses `homeTitle` (same string, via the template). */
export const defaultTitle = "Harley Performance and Repair in Upstate SC";

export const defaultDescription =
  "Independent Harley shop in Taylors / Upstate SC. Custom and chopper work, club-style builds, and motorcycle repair. Appointment only — no walk-ins.";

export const homeTitle = defaultTitle;

export const homeDescription = defaultDescription;

export const aboutTitle = "About — Custom Harley & Repair in Taylors";

export const aboutDescription =
  "Who works on your bike at Swafford Speed in Taylors, SC. Custom and chopper work, Harley repair, and builds from vintage through Milwaukee-Eight. Appointment only.";

export const keywords = [
  "Harley-Davidson performance shop Taylors SC",
  "custom Harley build Upstate SC",
  "chopper repair Greenville SC",
  "Harley repair Taylors SC",
  "club style Harley Greenville",
  "motorcycle mechanic Upstate SC",
  "V-twin shop Taylors",
] as const;

export const businessJsonLdDescription =
  "Independent Harley-Davidson performance and custom shop serving Taylors and the Upstate of South Carolina. Custom and chopper work, club-style builds, and motorcycle repair. Appointment only.";
