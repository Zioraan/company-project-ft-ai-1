import { Suspense } from "react";
import { AssetEntryFormClient } from "@/components/inventory/AssetEntryFormClient";
import { getAssets } from "@/services/inventory";
import type { Asset } from "@/types/inventory";

interface InboundOrderPageProps {
  searchParams: Promise<{ asset_id?: string }>;
}

export default async function InboundOrderPage({
  searchParams,
}: InboundOrderPageProps) {
  const params = await searchParams;
  const initialAssetId = params.asset_id
    ? Number(params.asset_id)
    : undefined;

  let assets: Asset[] = [];
  let initialError: string | undefined;

  try {
    assets = await getAssets();
  } catch {
    initialError = "Unable to load assets. Please try again.";
    assets = [];
  }

  return (
    <Suspense
      fallback={
        <section className="px-4 py-6 md:px-8">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Loading inbound order form...
          </p>
        </section>
      }
    >
      <AssetEntryFormClient
        initialAssets={assets}
        initialAssetId={initialAssetId}
        initialError={initialError}
      />
    </Suspense>
  );
}
