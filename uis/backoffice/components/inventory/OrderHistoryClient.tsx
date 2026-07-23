"use client";

import { OrderHistoryTable } from "@/components/inventory/OrderHistoryTable";
import { AsyncState } from "@/components/ui/AsyncState";
import { useInventoryOrders } from "@/hooks/useInventoryOrders";
import type { OrderHistoryItem } from "@/types/inventory";

interface OrderHistoryClientProps {
  initialData?: OrderHistoryItem[];
  initialError?: string;
}

export function OrderHistoryClient({
  initialData,
  initialError,
}: OrderHistoryClientProps) {
  const { orders, loading, error, refetch } = useInventoryOrders({ initialData });
  const listError =
    error ??
    (!loading && orders.length === 0 ? (initialError ?? null) : null);

  return (
    <section className="px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Asset Order History
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Read-only log of inbound deliveries and outbound allocations.
          </p>
        </header>

        <AsyncState loading={loading} error={listError} onRetry={() => void refetch()}>
          <OrderHistoryTable orders={orders} />
        </AsyncState>
      </div>
    </section>
  );
}
