import type { Metadata } from "next";
import { Suspense } from "react";
import { storageMode } from "@/lib/db";
import {
  LOCAL_ADMIN_EMAIL,
  LOCAL_ADMIN_PASSWORD,
  LOCAL_CREDENTIALS_ARE_DEFAULT,
} from "@/lib/db/local";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "ورود به مدیریت" };

async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safe =
    next && next.startsWith("/admin") && !next.startsWith("/admin/login")
      ? next
      : "/admin";
  const local = storageMode() === "local";
  const hint =
    local && LOCAL_CREDENTIALS_ARE_DEFAULT && process.env.NODE_ENV !== "production"
      ? { email: LOCAL_ADMIN_EMAIL, password: LOCAL_ADMIN_PASSWORD }
      : null;

  return (
    <LoginForm
      next={safe}
      defaultEmail={local ? LOCAL_ADMIN_EMAIL : ""}
      hint={hint}
    />
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <Suspense fallback={<div className="login" />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}