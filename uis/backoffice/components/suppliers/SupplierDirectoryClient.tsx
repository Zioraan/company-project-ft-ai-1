"use client";

import { useState } from "react";
import { SupplierCreateForm } from "@/components/suppliers/SupplierCreateForm";
import { SupplierFiltersBar } from "@/components/suppliers/SupplierFiltersBar";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import { useSupplierFilters } from "@/hooks/useSupplierFilters";
import { useSuppliers } from "@/hooks/useSuppliers";
import {
  createSupplier,
  deleteSupplier,
  updateSupplierRate,
  updateSupplierStatus,
} from "@/services/suppliers";
import type { Supplier, SupplierStatus } from "@/types/suppliers";

interface SupplierDirectoryClientProps {
  initialData?: Supplier[];
}

export function SupplierDirectoryClient({
  initialData,
}: SupplierDirectoryClientProps) {
  const { filters, setFilters } = useSupplierFilters();
  const { suppliers, loading, error, refetch } = useSuppliers(filters, {
    initialData,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRateUpdate = async (supplierId: string, monthlyRate: number) => {
    setActionError(null);
    await updateSupplierRate(supplierId, { monthly_rate: monthlyRate });
    await refetch();
  };

  const handleStatusUpdate = async (
    supplierId: string,
    status: SupplierStatus,
  ) => {
    setActionError(null);
    await updateSupplierStatus(supplierId, { status });
    await refetch();
  };

  const handleDelete = async (supplierId: string) => {
    setActionError(null);
    setDeletingId(supplierId);

    try {
      await deleteSupplier(supplierId);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete supplier.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="px-4 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6">
        <header className="rounded-lg bg-slate-900 p-5 text-white dark:bg-slate-800">
          <h1 className="text-2xl font-bold">Supplier Directory</h1>
          <p className="mt-1 text-sm text-slate-200">
            Official registry of Nexova external service providers for Spain and
            USA operations.
          </p>
        </header>

        <SupplierCreateForm
          onSubmit={async (input) => {
            await createSupplier(input);
            await refetch();
          }}
        />

        <SupplierFiltersBar filters={filters} onChange={setFilters} />

        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Suppliers
            </h2>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Total: {suppliers.length}
            </span>
          </div>

          {loading && (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Loading suppliers...
            </p>
          )}
          {error && (
            <p className="text-sm text-red-700 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          {actionError && (
            <p className="mb-3 text-sm text-red-700 dark:text-red-400" role="alert">
              {actionError}
            </p>
          )}
          {!loading && !error && (
            <SupplierTable
              suppliers={suppliers}
              onRateUpdate={handleRateUpdate}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          )}
        </section>
      </div>
    </section>
  );
}
