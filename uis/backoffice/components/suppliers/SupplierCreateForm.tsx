"use client";

import { useState } from "react";
import { SuppliersApiError } from "@/lib/suppliers-api-client";
import type { SupplierCreateInput } from "@/types/suppliers";
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "@/lib/suppliers-mappers";
import { SUPPLIER_COUNTRIES } from "@/types/suppliers";

const EMPTY_FORM: SupplierCreateInput = {
  name: "",
  country: "Spain",
  categories: ["job_boards"],
  monthly_rate: 0,
  currency: "EUR",
  status: "active",
  contract_renewal_date: "",
  contact_email: "",
  notes: "",
};

interface SupplierCreateFormProps {
  onSubmit: (input: SupplierCreateInput) => Promise<void>;
}

function currencyForCountry(country: SupplierCreateInput["country"]) {
  return country === "Spain" ? "EUR" : "USD";
}

export function SupplierCreateForm({ onSubmit }: SupplierCreateFormProps) {
  const [form, setForm] = useState<SupplierCreateInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    if (!form.categories.length) {
      setError("At least one category is required.");
      return;
    }

    if (!form.monthly_rate || form.monthly_rate <= 0) {
      setError("Monthly rate must be greater than zero.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        contract_renewal_date: form.contract_renewal_date || undefined,
        contact_email: form.contact_email || undefined,
        notes: form.notes || undefined,
      });
      setForm(EMPTY_FORM);
      setSuccess("Supplier created successfully.");
    } catch (err) {
      const message =
        err instanceof SuppliersApiError
          ? err.message
          : "Failed to create supplier.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Register New Supplier
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Name
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Country
          <select
            value={form.country}
            onChange={(event) => {
              const country = event.target.value as SupplierCreateInput["country"];
              setForm((current) => ({
                ...current,
                country,
                currency: currencyForCountry(country),
              }));
            }}
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {SUPPLIER_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
          Categories
          <select
            multiple
            value={form.categories}
            onChange={(event) => {
              const selected = Array.from(event.target.selectedOptions).map(
                (option) => option.value as SupplierCreateInput["categories"][number],
              );
              setForm((current) => ({ ...current, categories: selected }));
            }}
            className="min-h-28 rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Monthly rate
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.monthly_rate || ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                monthly_rate: Number(event.target.value),
              }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Currency
          <input
            value={form.currency}
            readOnly
            className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as SupplierCreateInput["status"],
              }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Contract renewal date
          <input
            type="date"
            value={form.contract_renewal_date ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contract_renewal_date: event.target.value,
              }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Contact email
          <input
            type="email"
            value={form.contact_email ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contact_email: event.target.value,
              }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
          Notes
          <textarea
            value={form.notes ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            className="min-h-20 rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {submitting ? "Creating..." : "Create supplier"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </p>
      )}
    </section>
  );
}
