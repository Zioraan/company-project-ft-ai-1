"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isAuthenticated } from "@/lib/auth-token";

const AUTH_GUARD_TIMEOUT_MS = 8000;

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setTimedOut(true);
      }
    }, AUTH_GUARD_TIMEOUT_MS);

    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [router]);

  if (timedOut && !ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 dark:bg-slate-950">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Session verification is taking longer than expected.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
