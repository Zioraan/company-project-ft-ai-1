"use client";

import { AssetExitForm } from "@/components/inventory/AssetExitForm";
import { AsyncState } from "@/components/ui/AsyncState";
import { useAssets } from "@/hooks/useAssets";
import type { Asset } from "@/types/inventory";

interface AssetExitFormClientProps {
  initialAssets: Asset[];
  initialAssetId?: number;
  initialError?: string;
}

export function AssetExitFormClient({
  initialAssets,
  initialAssetId,
  initialError,
}: AssetExitFormClientProps) {
  const { assets, loading, error, refetch } = useAssets({
    initialData: initialAssets.length > 0 ? initialAssets : undefined,
  });
  const listError =
    error ??
    (!loading && assets.length === 0 ? (initialError ?? null) : null);

  return (
    <section className="px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Outbound Asset Exit
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Register an allocation to an employee or a consumption event.
          </p>
        </header>

        <AsyncState loading={loading} error={listError} onRetry={() => void refetch()}>
          <AssetExitForm assets={assets} initialAssetId={initialAssetId} />
        </AsyncState>
      </div>
    </section>
  );
}
