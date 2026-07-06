"use client";

import { useRouter } from "next/navigation";
import { SupplierDetailCard } from "@/components/suppliers/SupplierDetailCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { useSupplierDetail } from "@/hooks/useSupplierDetail";
import type { Supplier } from "@/types/suppliers";

interface SupplierDetailClientProps {
  supplierId: string;
  initialSupplier?: Supplier | null;
}

export function SupplierDetailClient({
  supplierId,
  initialSupplier,
}: SupplierDetailClientProps) {
  const router = useRouter();
  const {
    supplier,
    loading,
    saving,
    error,
    refetch,
    saveRate,
    saveStatus,
    removeSupplier,
  } = useSupplierDetail(supplierId, { initialSupplier });

  if (loading) {
    return (
      <section className="px-4 py-6 md:px-8">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Loading supplier...
        </p>
      </section>
    );
  }

  if (error || !supplier) {
    return (
      <section className="px-4 py-6 md:px-8">
        <ErrorState
          message={error ?? "Supplier not found."}
          onRetry={() => void refetch()}
          backHref="/suppliers"
          backLabel="Back to directory"
        />
      </section>
    );
  }

  return (
    <section className="px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        {error ? (
          <p
            className="mb-4 text-sm text-red-700 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <SupplierDetailCard
          supplier={supplier}
          saving={saving}
          onRateSave={async (monthlyRate) => {
            await saveRate({ monthly_rate: monthlyRate });
          }}
          onStatusSave={async (status) => {
            await saveStatus(status);
          }}
          onDelete={async () => {
            try {
              await removeSupplier();
              router.push("/suppliers");
            } catch {
              // save error surfaced via hook error state
            }
          }}
        />
      </div>
    </section>
  );
}
