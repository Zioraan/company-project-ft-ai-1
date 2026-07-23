import { Suspense } from "react";
import { AssetListClient } from "@/components/inventory/AssetListClient";
import { getAssets } from "@/services/inventory";

export default async function InventoryProductsPage() {
  let initialData;
  let initialError: string | undefined;

  try {
    initialData = await getAssets();
  } catch {
    initialError = "Unable to load assets. Please try again.";
  }

  return (
    <Suspense
      fallback={
        <section className="px-4 py-6 md:px-8">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Loading asset inventory...
          </p>
        </section>
      }
    >
      <AssetListClient initialData={initialData} initialError={initialError} />
    </Suspense>
  );
}
