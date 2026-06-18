"use client";

import { useRouter } from "next/navigation";
import { SupplierDetailCard } from "@/components/suppliers/SupplierDetailCard";
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
  const { supplier, loading, saving, error, saveRate, saveStatus, removeSupplier } =
    useSupplierDetail(supplierId, { initialSupplier });

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
        <p className="text-sm text-red-700 dark:text-red-400" role="alert">
          {error ?? "Supplier not found."}
        </p>
      </section>
    );
  }

  return (
    <section className="px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        {error && (
          <p className="mb-4 text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
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
            await removeSupplier();
            router.push("/suppliers");
          }}
        />
      </div>
    </section>
  );
}
