"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { setUnauthorizedHandler } from "@/lib/platform-api-client";

export function UnauthorizedHandlerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      router.replace("/login");
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [router]);

  return <>{children}</>;
}
