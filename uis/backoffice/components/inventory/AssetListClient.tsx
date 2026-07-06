"use client";

import { AssetTable } from "@/components/inventory/AssetTable";
import { AsyncState } from "@/components/ui/AsyncState";
import { useAssets } from "@/hooks/useAssets";
import type { Asset } from "@/types/inventory";

interface AssetListClientProps {
  initialData?: Asset[];
  initialError?: string;
}

export function AssetListClient({
  initialData,
  initialError,
}: AssetListClientProps) {
  const { assets, loading, error, refetch } = useAssets({ initialData });
  const listError =
    error ??
    (!loading && assets.length === 0 ? (initialError ?? null) : null);

  return (
    <section className="px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Asset Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Track equipment and supplies across Valencia and Miami offices.
          </p>
        </header>

        <AsyncState loading={loading} error={listError} onRetry={() => void refetch()}>
          <AssetTable assets={assets} />
        </AsyncState>
      </div>
    </section>
  );
}
