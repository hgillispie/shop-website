/** Live shop host for printed QR/NFC and GSC-preferred canonicals. Never www. */
export const APEX_SITE_URL = "https://swaffordspeed.com";

/** Off-site Google leave-a-review URL. `/review` 308s here; keep it off sitemap/nav. */
export const GOOGLE_REVIEW_URL = "https://g.page/r/CWHtiZtRjnuhEAI/review";

function parseOrigin(raw: string | undefined): URL {
  const fallback = raw?.trim() || "http://localhost:3000";
  try {
    return new URL(fallback);
  } catch {
    return new URL("http://localhost:3000");
  }
}

/**
 * Public site origin for sitemap, robots, metadataBase, and canonicals.
 * Reads `NEXT_PUBLIC_SITE_URL`, drops a trailing slash, and maps
 * www.swaffordspeed.com → apex so Google has one preferred host.
 */
export function siteOrigin(from = process.env.NEXT_PUBLIC_SITE_URL): string {
  const url = parseOrigin(from);
  if (
    url.hostname === "www.swaffordspeed.com" ||
    url.hostname === "swaffordspeed.com"
  ) {
    return APEX_SITE_URL;
  }
  return url.origin;
}

/** Absolute apex (or local) URL with no trailing slash. `"/"` → origin only. */
export function canonicalUrl(
  pathname: string = "/",
  from?: string,
): string {
  const origin = siteOrigin(from);
  const trimmed = pathname.trim() || "/";
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path === "/") return origin;
  return `${origin}${path.replace(/\/+$/, "")}`;
}
