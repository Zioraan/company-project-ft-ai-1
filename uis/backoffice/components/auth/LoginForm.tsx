"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { PlatformApiError } from "@/lib/platform-api-client";
import { login } from "@/services/auth";
import {
  rotateTelemetrySessionId,
  track,
} from "@/services/telemetry";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      rotateTelemetrySessionId();
      track("user_login_succeeded", {});
      router.replace("/");
    } catch (submitError) {
      const message =
        submitError instanceof PlatformApiError
          ? submitError.message
          : "Unable to sign in. Please try again.";
      const failureReason =
        submitError instanceof PlatformApiError && submitError.status === 0
          ? "network_error"
          : "invalid_credentials";
      track("user_login_failed", { failure_reason: failureReason });
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Email</span>
        <input
          className={inputClassName}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Password</span>
        <input
          className={inputClassName}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? (
        <div className="space-y-1">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Check your email and password, then try signing in again.
          </p>
        </div>
      ) : null}

      <button
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        type="submit"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Link className="font-medium text-slate-900 hover:underline dark:text-slate-100" href="/forgot-password">
          Forgot your password?
        </Link>
        <p>
          Need an account?{" "}
          <Link className="font-medium text-slate-900 hover:underline dark:text-slate-100" href="/register">
            Register
          </Link>
        </p>
      </div>
    </form>
  );
}
