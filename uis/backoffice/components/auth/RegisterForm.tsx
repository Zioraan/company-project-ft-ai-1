"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { PlatformApiError } from "@/lib/platform-api-client";
import { register } from "@/services/auth";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

function extractFieldErrors(payload: unknown): Record<string, string> {
  if (typeof payload !== "object" || payload === null || !("detail" in payload)) {
    return {};
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (!Array.isArray(detail)) {
    return {};
  }

  const errors: Record<string, string> = {};
  for (const item of detail) {
    if (
      typeof item === "object" &&
      item !== null &&
      "loc" in item &&
      "msg" in item &&
      Array.isArray((item as { loc: unknown[] }).loc)
    ) {
      const field = (item as { loc: unknown[]; msg: string }).loc
        .filter((part) => typeof part === "string")
        .pop();
      if (typeof field === "string") {
        errors[field] = (item as { msg: string }).msg;
      }
    }
  }
  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      await register(email, password, name);
      router.replace("/");
    } catch (submitError) {
      if (submitError instanceof PlatformApiError) {
        setFieldErrors(extractFieldErrors(submitError.payload));
        setError(submitError.message);
      } else {
        setError("Unable to register. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Name</span>
        <input
          className={inputClassName}
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {fieldErrors.name ? (
          <span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</span>
        ) : null}
      </label>

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
        {fieldErrors.email ? (
          <span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</span>
        ) : null}
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Password</span>
        <input
          className={inputClassName}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {fieldErrors.password ? (
          <span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</span>
        ) : null}
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <button
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        type="submit"
        disabled={loading}
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link className="font-medium text-slate-900 hover:underline dark:text-slate-100" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
