import { Suspense } from "react";
import { OrderHistoryClient } from "@/components/inventory/OrderHistoryClient";
import { getOrderHistory } from "@/services/inventory";

export default async function InventoryOrdersPage() {
  let initialData;
  let initialError: string | undefined;

  try {
    initialData = await getOrderHistory();
  } catch {
    initialError = "Unable to load order history. Please try again.";
  }

  return (
    <Suspense
      fallback={
        <section className="px-4 py-6 md:px-8">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Loading order history...
          </p>
        </section>
      }
    >
      <OrderHistoryClient
        initialData={initialData}
        initialError={initialError}
      />
    </Suspense>
  );
}
