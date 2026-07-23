import type { ReactNode } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

type AsyncStateProps = {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  backHref?: string;
  backLabel?: string;
  loadingFallback?: ReactNode;
  children: ReactNode;
};

export function AsyncState({
  loading,
  error,
  onRetry,
  retryLabel,
  backHref,
  backLabel,
  loadingFallback = (
    <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
  ),
  children,
}: AsyncStateProps) {
  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={onRetry}
        retryLabel={retryLabel}
        backHref={backHref}
        backLabel={backLabel}
      />
    );
  }

  return <>{children}</>;
}
