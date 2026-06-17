"use client";

import type { SupplierFilters } from "@/types/suppliers";
import {
  CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
} from "@/lib/suppliers-mappers";

interface SupplierFiltersBarProps {
  filters: SupplierFilters;
  onChange: (updates: Partial<SupplierFilters>) => void;
}

export function SupplierFiltersBar({
  filters,
  onChange,
}: SupplierFiltersBarProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        Filters
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Country
          <select
            value={filters.country ?? ""}
            onChange={(event) =>
              onChange({
                country: event.target.value
                  ? (event.target.value as SupplierFilters["country"])
                  : undefined,
              })
            }
            className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All countries</option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Category
          <select
            value={filters.category ?? ""}
            onChange={(event) =>
              onChange({
                category: event.target.value
                  ? (event.target.value as SupplierFilters["category"])
                  : undefined,
              })
            }
            className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
