"use client";

import { useState } from "react";
import { SuppliersApiError } from "@/lib/suppliers-api-client";
import { mapStatusLabel } from "@/lib/suppliers-mappers";
import type { Supplier, SupplierStatus } from "@/types/suppliers";

interface SupplierStatusToggleProps {
  supplier: Supplier;
  onSave: (status: SupplierStatus) => Promise<void>;
}

export function SupplierStatusToggle({
  supplier,
  onSave,
}: SupplierStatusToggleProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus: SupplierStatus =
    supplier.status === "active" ? "suspended" : "active";

  const handleToggle = async () => {
    setSaving(true);
    setError(null);

    try {
      await onSave(nextStatus);
    } catch (err) {
      const message =
        err instanceof SuppliersApiError
          ? err.message
          : "Failed to update status.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
      >
        {saving
          ? "Updating..."
          : `Mark ${mapStatusLabel(nextStatus).toLowerCase()}`}
      </button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}
