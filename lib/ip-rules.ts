import "server-only";
import { db } from "@/lib/db/client";

// IPv4 only for v1 — covers the overwhelming majority of real visitor
// traffic; IPv6 rules simply never match today.
function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    result = (result << 8) + n;
  }
  return result >>> 0;
}

function matchesCidr(ip: string, cidr: string): boolean {
  const ipInt = ipToInt(ip);
  if (ipInt === null) return false;

  if (!cidr.includes("/")) {
    return ipInt === ipToInt(cidr);
  }

  const [base, bitsStr] = cidr.split("/");
  const baseInt = ipToInt(base);
  const bits = Number(bitsStr);
  if (baseInt === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

export async function checkIpAgainstRules(
  ip: string | null,
): Promise<{ matched: boolean; action?: "flag" | "block"; note?: string | null }> {
  if (!ip) return { matched: false };

  const rules = await db.query.ipRules.findMany();
  const match = rules.find((rule) => matchesCidr(ip, rule.cidr));
  if (!match) return { matched: false };

  return { matched: true, action: match.action, note: match.note };
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}
