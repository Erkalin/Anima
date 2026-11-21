"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { Icon } from "@/app/components/admin/Icons";
import { ThemeSwitcher } from "@/app/components/ThemeSwitcher";

const initial: LoginState = { error: null, email: "" };

export function LoginForm({
  next,
  defaultEmail,
  hint,
}: {
  next: string;
  defaultEmail: string;
  hint: { email: string; password: string } | null;
}) {
  const [state, action, pending] = useActionState(loginAction, {
    ...initial,
    email: defaultEmail,
  });

  return (
    <div className="login">
      <div className="login-theme">
        <ThemeSwitcher />
      </div>
      <svg
        className="login-staff"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[40, 70, 100, 130, 160].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="1200"
            y2={y}
            stroke="currentColor"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="login-card">
        <span className="login-mark">
          <Icon name="note" />
        </span>
        <h1>اتاق مدیریت</h1>
        <p className="lead">
          برای نوشتن و انتشار در وبلاگ، با حساب مدیر وارد شوید.
        </p>

        <form className="login-form" action={action}>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label className="label" htmlFor="email">
              <Icon name="mail" /> ایمیل
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input mono"
              autoComplete="username"
              required
              defaultValue={state.email || defaultEmail}
              placeholder="admin@studio.local"
              dir="ltr"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              <Icon name="lock" /> رمز عبور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          {state.error ? (
            <p className="field-error" role="alert">
              {state.error}
            </p>
          ) : null}

          <button
            className="btn btn-brass"
            type="submit"
            aria-disabled={pending}
          >
            {pending ? "در حال ورود…" : "ورود"}
            <Icon name="arrow" />
          </button>
        </form>

        {hint ? (
          <p className="login-note">
            حالتِ محلی فعال است. تا وقتی کلیدهای Supabase در <code>.env</code>{" "}
            گذاشته شوند، با این حساب وارد شوید:
            <br />
            <code>{hint.email}</code> · <code>{hint.password}</code>
          </p>
        ) : null}

        <Link className="login-back" href="/">
          <Icon name="arrow" /> بازگشت به سایت
        </Link>
      </div>
    </div>
  );
}