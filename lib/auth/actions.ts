"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { findAdminByEmail, storageMode } from "../db";
import { verifyPassword } from "../db/local";
import { anonClient } from "../db/supabase";
import {
  SESSION_COOKIE,
  expiryFromNow,
  sealSession,
  sessionCookieOptions,
} from "./session";

export type LoginState = { error: string | null; email: string };

const attempts = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

async function throttleKey(email: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return `${ip}:${email}`;
}

function blocked(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const entry = attempts.get(key);
  if (!entry || Date.now() > entry.until) {
    attempts.set(key, { count: 1, until: Date.now() + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "ایمیل و رمز عبور را وارد کنید.", email };
  }

  const key = await throttleKey(email);
  if (blocked(key)) {
    return {
      error: "تلاش‌های زیاد. ده دقیقه صبر کنید و دوباره امتحان کنید.",
      email,
    };
  }

  const mode = storageMode();
  const admin = await findAdminByEmail(email);

  if (!admin) {
    recordFailure(key);
    return { error: "این ایمیل دسترسی مدیریت ندارد.", email };
  }

  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let subject = admin.id;

  if (mode === "supabase") {
    const { data, error } = await anonClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session || !data.user) {
      recordFailure(key);
      return { error: "ایمیل یا رمز عبور درست نیست.", email };
    }
    accessToken = data.session.access_token;
    refreshToken = data.session.refresh_token;
    subject = data.user.id;
  } else {
    if (!admin.passwordHash || !verifyPassword(password, admin.passwordHash)) {
      recordFailure(key);
      return { error: "ایمیل یا رمز عبور درست نیست.", email };
    }
  }

  attempts.delete(key);

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    sealSession({
      sub: subject,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mode,
      exp: expiryFromNow(),
      at: accessToken,
      rt: refreshToken,
    }),
    sessionCookieOptions(),
  );

  const requested = String(formData.get("next") ?? "");
  const safeNext =
    requested.startsWith("/admin") && !requested.startsWith("/admin/login")
      ? requested
      : "/admin";
  redirect(safeNext);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}