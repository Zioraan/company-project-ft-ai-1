"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isAuthenticated } from "@/lib/auth-token";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
