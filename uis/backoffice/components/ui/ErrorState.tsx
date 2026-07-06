import Link from "next/link";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  backHref?: string;
  backLabel?: string;
};

export function ErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
  backHref,
  backLabel = "Go back",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
    >
      <p>{message}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-200 dark:text-red-950 dark:hover:bg-red-100"
          >
            {retryLabel}
          </button>
        ) : null}
        {backHref ? (
          <Link
            href={backHref}
            className="rounded-lg border border-red-400 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-100 dark:border-red-600 dark:text-red-100 dark:hover:bg-red-900/40"
          >
            {backLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
