"use client";

import { useEffect, useMemo, useState } from "react";
import { InventoryApiError } from "@/lib/inventory-api-client";
import { OFFICE_OPTIONS } from "@/lib/inventory-mappers";
import {
  currencyForOffice,
  normalizeCategory,
  normalizeOffice,
} from "@/lib/telemetry-normalize";
import { mapProcurementFailureReason } from "@/lib/telemetry-failure-reasons";
import { createAssetEntry } from "@/services/inventory";
import { track } from "@/services/telemetry";
import type { Asset, AssetEntryCreateInput } from "@/types/inventory";

const EMPTY_FORM: Omit<AssetEntryCreateInput, "asset_id"> = {
  quantity: 1,
  supplier: "",
  office: "Valencia",
  unit_cost: 0,
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

    const office = normalizeOffice(form.office) ?? "valencia";
    const productCategory = normalizeCategory(selectedAsset?.category);
    const programmeId = selectedAsset?.programme_id ?? "unassigned";
    const currency =
      currencyForOffice(form.office) ?? currencyForOffice(office) ?? "EUR";

    if (!assetId) {
      setError("Please select an asset.");
      track("inbound_order_failed", {
        office,
        product_category: productCategory,
        programme_id: programmeId,
        currency,
        failure_reason: "missing_asset",
      });
      return;
    }

    if (!form.supplier.trim()) {
      setError("Supplier name is required.");
      track("inbound_order_failed", {
        product_id: assetId,
        product_category: productCategory,
        programme_id: programmeId,
        office,
        quantity: form.quantity,
        currency,
        failure_reason: "missing_vendor",
      });
      return;
    }

    if (!form.quantity || form.quantity <= 0) {
      setError("Quantity must be greater than zero.");
      track("inbound_order_failed", {
        product_id: assetId,
        product_category: productCategory,
        programme_id: programmeId,
        office,
        quantity: form.quantity,
        currency,
        failure_reason: "invalid_quantity",
      });
      return;
    }

    if (form.unit_cost < 0 || Number.isNaN(form.unit_cost)) {
      setError("Unit cost must be zero or greater.");
      track("inbound_order_failed", {
        product_id: assetId,
        product_category: productCategory,
        programme_id: programmeId,
        office,
        quantity: form.quantity,
        currency,
        failure_reason: "invalid_unit_cost",
      });
      return;
    }

    setSubmitting(true);

    try {
      const created = await createAssetEntry({
        asset_id: assetId,
        quantity: form.quantity,
        supplier: form.supplier.trim(),
        office: form.office,
        unit_cost: form.unit_cost,
        currency: currency as AssetEntryCreateInput["currency"],
      });
      const resolvedOffice = normalizeOffice(created.office) ?? office;
      const resolvedCurrency = created.currency || currency;
      const materialProps = {
        product_id: created.asset_id,
        product_category:
          normalizeCategory(created.product_category) ?? productCategory,
        programme_id: created.programme_id || programmeId,
        office: resolvedOffice,
        quantity: created.quantity,
        currency: resolvedCurrency,
      };
      track("inbound_order_created", {
        inbound_order_id: created.id,
        ...materialProps,
        unit_cost: created.unit_cost,
        total_cost: created.unit_cost * created.quantity,
        vendor: form.supplier.trim(),
        created_by: created.user_uuid,
      });
      if (created.cost_variance_detected) {
        track("kit_cost_variance_detected", {
          ...materialProps,
          unit_cost: created.unit_cost,
          previous_unit_cost: created.previous_unit_cost ?? undefined,
          variance_threshold: 0.1,
        });
      }
      setForm(EMPTY_FORM);
      setAssetId(initialAssetId ?? "");
      setSuccess("Asset entry registered successfully.");
    } catch (err) {
      const message =
        err instanceof InventoryApiError
          ? err.message
          : "Failed to register asset entry.";
      setError(message);
      track("inbound_order_failed", {
        product_id: assetId,
        product_category: productCategory,
        programme_id: programmeId,
        office,
        quantity: form.quantity,
        currency,
        vendor: form.supplier.trim() || undefined,
        failure_reason: mapProcurementFailureReason(message),
      });
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
            {" · "}
            Programme: <strong>{selectedAsset.programme_id}</strong>
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
          Unit cost
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.unit_cost}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                unit_cost: Number(event.target.value),
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
