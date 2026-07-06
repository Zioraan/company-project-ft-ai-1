"use client";

import { useEffect, useMemo, useState } from "react";
import { InventoryApiError } from "@/lib/inventory-api-client";
import {
  OFFICE_OPTIONS,
} from "@/lib/inventory-mappers";
import { createAssetEntry } from "@/services/inventory";
import type { Asset, AssetEntryCreateInput } from "@/types/inventory";

const EMPTY_FORM: Omit<AssetEntryCreateInput, "asset_id"> = {
  quantity: 1,
  supplier: "",
  office: "Valencia",
};

interface AssetEntryFormProps {
  assets: Asset[];
  initialAssetId?: number;
}

export function AssetEntryForm({
  assets,
  initialAssetId,
}: AssetEntryFormProps) {
  const [assetId, setAssetId] = useState<number | "">(
    initialAssetId ?? "",
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialAssetId) {
      setAssetId(initialAssetId);
    }
  }, [initialAssetId]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === assetId),
    [assets, assetId],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!assetId) {
      setError("Please select an asset.");
      return;
    }

    if (!form.supplier.trim()) {
      setError("Supplier name is required.");
      return;
    }

    if (!form.quantity || form.quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    setSubmitting(true);

    try {
      await createAssetEntry({
        asset_id: assetId,
        quantity: form.quantity,
        supplier: form.supplier.trim(),
        office: form.office,
      });
      setForm(EMPTY_FORM);
      setAssetId(initialAssetId ?? "");
      setSuccess("Asset entry registered successfully.");
    } catch (err) {
      setError(
        err instanceof InventoryApiError
          ? err.message
          : "Failed to register asset entry.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Register Asset Entry
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
          Asset
          <select
            value={assetId}
            onChange={(event) =>
              setAssetId(
                event.target.value ? Number(event.target.value) : "",
              )
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            required
          >
            <option value="">Select an asset</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.sku}) — {asset.office}
              </option>
            ))}
          </select>
        </label>

        {selectedAsset ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 md:col-span-2">
            Current stock for selected asset:{" "}
            <strong>{selectedAsset.current_stock}</strong>
          </p>
        ) : null}

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Quantity
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                quantity: Number(event.target.value),
              }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Receiving office
          <select
            value={form.office}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                office: event.target.value as AssetEntryCreateInput["office"],
              }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {OFFICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
          Supplier
          <input
            value={form.supplier}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                supplier: event.target.value,
              }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            required
          />
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200 md:col-span-2"
          >
            {error}
          </p>
        ) : null}

        {success ? (
          <p
            role="status"
            className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 md:col-span-2"
          >
            {success}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {submitting ? "Submitting..." : "Register Entry"}
          </button>
        </div>
      </form>
    </section>
  );
}
