"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AssetTable } from "@/components/inventory/AssetTable";
import { AsyncState } from "@/components/ui/AsyncState";
import { useAssets } from "@/hooks/useAssets";
import { OFFICE_OPTIONS } from "@/lib/inventory-mappers";
import { normalizeOffice } from "@/lib/telemetry-normalize";
import { track } from "@/services/telemetry";
import type { Asset, AssetOffice } from "@/types/inventory";

interface AssetListClientProps {
  initialData?: Asset[];
  initialError?: string;
}

export function AssetListClient({
  initialData,
  initialError,
}: AssetListClientProps) {
  const { assets, loading, error, refetch } = useAssets({ initialData });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewedRef = useRef(false);
  const previousOfficeRef = useRef<string | undefined>(undefined);

  const officeParam = searchParams.get("office");
  const officeFilter =
    officeParam === "Valencia" || officeParam === "Miami"
      ? (officeParam as AssetOffice)
      : null;

  const filteredAssets = useMemo(() => {
    if (!officeFilter) {
      return assets;
    }
    return assets.filter((asset) => asset.office === officeFilter);
  }, [assets, officeFilter]);

  const listError =
    error ??
    (!loading && assets.length === 0 ? (initialError ?? null) : null);

  useEffect(() => {
    if (loading || viewedRef.current) {
      return;
    }
    viewedRef.current = true;
    track("asset_list_viewed", {
      office: normalizeOffice(officeFilter ?? undefined),
      result_count: filteredAssets.length,
      view_source: "nav_menu",
    });
  }, [loading, filteredAssets.length, officeFilter]);

  function handleOfficeFilterChange(nextValue: string) {
    const previous = previousOfficeRef.current;
    const params = new URLSearchParams(searchParams.toString());
    if (!nextValue) {
      params.delete("office");
    } else {
      params.set("office", nextValue);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);

    const canonicalOffice = nextValue
      ? normalizeOffice(nextValue)
      : "all";
    previousOfficeRef.current = canonicalOffice;
    track("office_filter_applied", {
      office: canonicalOffice,
      previous_office: previous,
      result_count:
        nextValue === ""
          ? assets.length
          : assets.filter((asset) => asset.office === nextValue).length,
    });
  }

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

        <label className="flex max-w-xs flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Office filter
          <select
            value={officeFilter ?? ""}
            onChange={(event) => handleOfficeFilterChange(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All offices</option>
            {OFFICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <AsyncState loading={loading} error={listError} onRetry={() => void refetch()}>
          <AssetTable assets={filteredAssets} />
        </AsyncState>
      </div>
    </section>
  );
}
