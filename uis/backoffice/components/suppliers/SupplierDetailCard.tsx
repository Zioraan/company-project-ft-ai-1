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

interface SupplierDetailCardProps {
  supplier: Supplier;
  saving?: boolean;
  onRateSave: (monthlyRate: number) => Promise<void>;
  onStatusSave: (status: SupplierStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}

function statusBadgeClass(variant: "active" | "suspended") {
  if (variant === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  }

  return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
}

export function SupplierDetailCard({
  supplier,
  saving = false,
  onRateSave,
  onStatusSave,
  onDelete,
}: SupplierDetailCardProps) {
  const renewalSoon = isRenewalSoon(supplier.contract_renewal_date);

  return (
    <section
      className={`rounded-lg border bg-white p-6 dark:bg-slate-900 ${
        renewalSoon
          ? "border-amber-400 dark:border-amber-500"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <Link href="/suppliers" className="hover:underline">
              Supplier Directory
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {supplier.name}
          </h1>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(
            supplierStatusVariant(supplier.status),
          )}`}
        >
          {mapStatusLabel(supplier.status)}
        </span>
      </div>

      <dl className="grid gap-4 md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Country
          </dt>
          <dd className="text-slate-900 dark:text-slate-100">{supplier.country}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Categories
          </dt>
          <dd className="text-slate-900 dark:text-slate-100">
            {mapCategoriesLabel(supplier.categories)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Monthly rate
          </dt>
          <dd className="text-slate-900 dark:text-slate-100">
            {formatMonthlyRate(supplier.monthly_rate, supplier.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Rate updated at
          </dt>
          <dd className="text-slate-900 dark:text-slate-100">
            {formatRateUpdatedAt(supplier.rate_updated_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Contract renewal
          </dt>
          <dd className="text-slate-900 dark:text-slate-100">
            {supplier.contract_renewal_date ?? "—"}
            {renewalSoon && (
              <span className="ml-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                Renewal soon
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Contact email
          </dt>
          <dd className="text-slate-900 dark:text-slate-100">
            {supplier.contact_email ?? "—"}
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Notes
          </dt>
          <dd className="whitespace-pre-wrap text-slate-900 dark:text-slate-100">
            {supplier.notes ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
        <SupplierRateEditor supplier={supplier} onSave={onRateSave} />
        <SupplierStatusToggle supplier={supplier} onSave={onStatusSave} />
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50 dark:border-red-800 dark:text-red-300"
        >
          {saving ? "Deleting..." : "Delete supplier"}
        </button>
      </div>
    </section>
  );
}
