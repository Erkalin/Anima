import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { anonClient } from "../db/supabase";
import type { SessionAdmin } from "../types";
import {
  SESSION_COOKIE,
  expiryFromNow,
  sealSession,
  sessionCookieOptions,
  unsealSession,
  type SessionPayload,
} from "./session";

/**
 * Reads trust the sealed cookie: it is AES-GCM authenticated and carries its
 * own expiry, so it cannot be forged or extended by the client. Mutations call
 * requireVerifiedAdmin, which additionally re-checks the Supabase token so a
 * revoked account cannot keep writing.
 */
export const currentAdmin = cache(async (): Promise<SessionAdmin | null> => {
  await connection();
  const store = await cookies();
  const payload = unsealSession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
});

export async function requireAdmin(): Promise<SessionAdmin> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

async function rawSession(): Promise<SessionPayload | null> {
  await connection();
  const store = await cookies();
  return unsealSession(store.get(SESSION_COOKIE)?.value);
}

export async function requireVerifiedAdmin(): Promise<SessionAdmin> {
  const payload = await rawSession();
  if (!payload) redirect("/admin/login");

  if (payload.mode === "supabase" && payload.at) {
    const client = anonClient();
    const { data, error } = await client.auth.getUser(payload.at);
    if (error || !data.user) {
      if (!payload.rt) redirect("/admin/login");
      const refreshed = await client.auth.refreshSession({
        refresh_token: payload.rt,
      });
      const next = refreshed.data.session;
      if (refreshed.error || !next) redirect("/admin/login");
      const store = await cookies();
      store.set(
        SESSION_COOKIE,
        sealSession({
          ...payload,
          at: next.access_token,
          rt: next.refresh_token,
          exp: expiryFromNow(),
        }),
        sessionCookieOptions(),
      );
    }
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}