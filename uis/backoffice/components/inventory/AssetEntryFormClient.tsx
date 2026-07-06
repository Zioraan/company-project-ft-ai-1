"use client";

import { AssetEntryForm } from "@/components/inventory/AssetEntryForm";
import { AsyncState } from "@/components/ui/AsyncState";
import { useAssets } from "@/hooks/useAssets";
import type { Asset } from "@/types/inventory";

interface AssetEntryFormClientProps {
  initialAssets: Asset[];
  initialAssetId?: number;
  initialError?: string;
}

export function AssetEntryFormClient({
  initialAssets,
  initialAssetId,
  initialError,
}: AssetEntryFormClientProps) {
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
            Inbound Asset Entry
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Register a purchase or supplier delivery received by Nexova.
          </p>
        </header>

        <AsyncState loading={loading} error={listError} onRetry={() => void refetch()}>
          <AssetEntryForm assets={assets} initialAssetId={initialAssetId} />
        </AsyncState>
      </div>
    </section>
  );
}
