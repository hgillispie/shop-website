"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { ipRules } from "@/lib/db/schema";

export async function addIpRule(formData: FormData) {
  const cidr = String(formData.get("cidr") ?? "").trim();
  const action = String(formData.get("action") ?? "flag") as "flag" | "block";
  if (!cidr) return;

  await db.insert(ipRules).values({
    cidr,
    action,
    note: String(formData.get("note") ?? "").trim() || null,
  });

  revalidatePath("/admin/analytics");
}
