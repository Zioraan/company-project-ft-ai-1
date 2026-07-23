import { Suspense } from "react";
import { AssetExitFormClient } from "@/components/inventory/AssetExitFormClient";
import { getAssets } from "@/services/inventory";
import type { Asset } from "@/types/inventory";

interface OutboundOrderPageProps {
  searchParams: Promise<{ asset_id?: string }>;
}

export default async function OutboundOrderPage({
  searchParams,
}: OutboundOrderPageProps) {
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
            Loading outbound order form...
          </p>
        </section>
      }
    >
      <AssetExitFormClient
        initialAssets={assets}
        initialAssetId={initialAssetId}
        initialError={initialError}
      />
    </Suspense>
  );
}
