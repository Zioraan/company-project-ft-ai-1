"use client";

import { useState } from "react";
import { SuppliersApiError } from "@/lib/suppliers-api-client";
import type { Supplier } from "@/types/suppliers";

interface SupplierRateEditorProps {
  supplier: Supplier;
  onSave: (monthlyRate: number) => Promise<void>;
}

export function SupplierRateEditor({
  supplier,
  onSave,
}: SupplierRateEditorProps) {
  const [value, setValue] = useState(String(supplier.monthly_rate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const monthlyRate = Number(value);
    if (!monthlyRate || monthlyRate <= 0) {
      setError("Monthly rate must be greater than zero.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(monthlyRate);
    } catch (err) {
      const message =
        err instanceof SuppliersApiError
          ? err.message
          : "Failed to update rate.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          {saving ? "Saving..." : "Update rate"}
        </button>
      </div>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}
