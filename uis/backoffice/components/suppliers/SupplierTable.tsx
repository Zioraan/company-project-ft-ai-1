"use client";

import Link from "next/link";
import { SupplierRateEditor } from "@/components/suppliers/SupplierRateEditor";
import { SupplierStatusToggle } from "@/components/suppliers/SupplierStatusToggle";
import {
  formatMonthlyRate,
  formatRateUpdatedAt,
  isRenewalSoon,
  mapCategoriesLabel,
  mapStatusLabel,
  supplierStatusVariant,
} from "@/lib/suppliers-mappers";
import type { Supplier, SupplierStatus } from "@/types/suppliers";

interface SupplierTableProps {
  suppliers: Supplier[];
  onRateUpdate: (supplierId: string, monthlyRate: number) => Promise<void>;
  onStatusUpdate: (supplierId: string, status: SupplierStatus) => Promise<void>;
  onDelete: (supplierId: string) => Promise<void>;
  deletingId?: string | null;
}

function statusBadgeClass(variant: "active" | "suspended") {
  if (variant === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  }

  return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
}

export function SupplierTable({
  suppliers,
  onRateUpdate,
  onStatusUpdate,
  onDelete,
  deletingId,
}: SupplierTableProps) {
  if (suppliers.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        No suppliers match the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2 font-medium">Supplier</th>
            <th className="px-3 py-2 font-medium">Country</th>
            <th className="px-3 py-2 font-medium">Categories</th>
            <th className="px-3 py-2 font-medium">Monthly rate</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Renewal</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => {
            const renewalSoon = isRenewalSoon(supplier.contract_renewal_date);
            const statusVariant = supplierStatusVariant(supplier.status);
            const rowClass =
              supplier.status === "suspended"
                ? "opacity-70"
                : "opacity-100";

            return (
              <tr
                key={supplier.id}
                className={`border-b border-slate-100 dark:border-slate-800 ${rowClass} ${
                  renewalSoon
                    ? "border-l-4 border-l-amber-400 dark:border-l-amber-500"
                    : ""
                }`}
              >
                <td className="px-3 py-3">
                  <Link
                    href={`/suppliers/${supplier.id}`}
                    className="font-medium text-slate-900 hover:underline dark:text-slate-100"
                  >
                    {supplier.name}
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Updated {formatRateUpdatedAt(supplier.rate_updated_at)}
                  </p>
                </td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                  {supplier.country}
                </td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                  {mapCategoriesLabel(supplier.categories)}
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {formatMonthlyRate(supplier.monthly_rate, supplier.currency)}
                  </p>
                  <SupplierRateEditor
                    supplier={supplier}
                    onSave={(monthlyRate) =>
                      onRateUpdate(supplier.id, monthlyRate)
                    }
                  />
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(statusVariant)}`}
                  >
                    {mapStatusLabel(supplier.status)}
                  </span>
                  <div className="mt-2">
                    <SupplierStatusToggle
                      supplier={supplier}
                      onSave={(status) => onStatusUpdate(supplier.id, status)}
                    />
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                  {supplier.contract_renewal_date ? (
                    <div>
                      <p>{supplier.contract_renewal_date}</p>
                      {renewalSoon && (
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          Renewal soon
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onDelete(supplier.id)}
                    disabled={deletingId === supplier.id}
                    className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-50 dark:border-red-800 dark:text-red-300"
                  >
                    {deletingId === supplier.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
