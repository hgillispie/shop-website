"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let authenticated = false;
  let sessionIdentifier = identifier;

  // DB-backed accounts (admin_users) are checked first — supports multiple
  // logins going forward. Falls back to the single env-var credential below
  // if the DB is unreachable or has no match, so the original login keeps
  // working regardless.
  try {
    const dbUser = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.username, identifier.toLowerCase()),
    });
    if (dbUser && (await bcrypt.compare(password, dbUser.passwordHash))) {
      authenticated = true;
      sessionIdentifier = dbUser.username;
    }
  } catch (error) {
    console.error("[auth] admin_users lookup failed, falling back to env credential:", error);
  }

  if (!authenticated) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const adminPasswordHashEncoded = process.env.ADMIN_PASSWORD_HASH;

    if (adminEmail && adminPasswordHashEncoded && identifier.toLowerCase() === adminEmail) {
      const adminPasswordHash = Buffer.from(adminPasswordHashEncoded, "base64").toString("utf8");
      if (await bcrypt.compare(password, adminPasswordHash)) {
        authenticated = true;
        sessionIdentifier = adminEmail;
      }
    }
  }

  if (!authenticated) {
    return { error: "Invalid email or password." };
  }

  const token = await createSessionToken(sessionIdentifier);
  await setSessionCookie(token);
  redirect("/admin/requests");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}
