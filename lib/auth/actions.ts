"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPasswordHashEncoded = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminPasswordHashEncoded) {
    console.error("[auth] ADMIN_EMAIL or ADMIN_PASSWORD_HASH is not set.");
    return { error: "Admin login is not configured yet." };
  }

  if (email !== adminEmail) {
    return { error: "Invalid email or password." };
  }

  const adminPasswordHash = Buffer.from(adminPasswordHashEncoded, "base64").toString("utf8");
  const valid = await bcrypt.compare(password, adminPasswordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const token = await createSessionToken(email);
  await setSessionCookie(token);
  redirect("/admin/requests");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}
