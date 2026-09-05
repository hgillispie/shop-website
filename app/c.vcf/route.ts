import { NextResponse } from "next/server";
import { buildShopVcard, VCARD_HEADERS } from "@/lib/vcard";

// Static so CDN can cache the exact bytes. Do not put a page.tsx next to
// this file — Camera / NFC must hit the vCard itself, not a landing page.
export const dynamic = "force-static";

export function GET() {
  return new NextResponse(buildShopVcard(), {
    status: 200,
    headers: VCARD_HEADERS,
  });
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: VCARD_HEADERS,
  });
}
