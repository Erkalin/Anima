import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AdminRole } from "../types";

export const SESSION_COOKIE = "mw_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  mode: "supabase" | "local";
  /** epoch seconds */
  exp: number;
  /** Supabase access token, present in supabase mode only */
  at?: string;
  /** Supabase refresh token */
  rt?: string;
};

let cachedSecret: Buffer | null = null;

/**
 * SESSION_SECRET when provided; otherwise a secret generated once and kept in
 * the local data dir. Read synchronously so Proxy can verify without awaiting
 * filesystem I/O on every request.
 */
function secret(): Buffer {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) {
    cachedSecret = createHash("sha256").update(fromEnv).digest();
    return cachedSecret;
  }
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "session-secret");
  try {
    cachedSecret = Buffer.from(readFileSync(file, "utf8").trim(), "hex");
    if (cachedSecret.length !== 32) throw new Error("bad length");
  } catch {
    mkdirSync(dir, { recursive: true });
    const generated = randomBytes(32);
    writeFileSync(file, generated.toString("hex"), { mode: 0o600 });
    cachedSecret = generated;
  }
  return cachedSecret;
}

const b64 = (b: Buffer) => b.toString("base64url");

export function sealSession(payload: SessionPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  return `${b64(iv)}.${b64(cipher.getAuthTag())}.${b64(body)}`;
}

export function unsealSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const iv = Buffer.from(parts[0], "base64url");
    const tag = Buffer.from(parts[1], "base64url");
    const body = Buffer.from(parts[2], "base64url");
    const decipher = createDecipheriv("aes-256-gcm", secret(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([
      decipher.update(body),
      decipher.final(),
    ]).toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.sub || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function expiryFromNow(): number {
  return Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
}