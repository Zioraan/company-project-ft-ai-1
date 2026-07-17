"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { InventoryApiError } from "@/lib/inventory-api-client";
import {
  EXIT_TYPE_OPTIONS,
  OFFICE_OPTIONS,
} from "@/lib/inventory-mappers";
import {
  currencyForOffice,
  normalizeCategory,
  normalizeOffice,
} from "@/lib/telemetry-normalize";
import { mapAssignmentFailureReason } from "@/lib/telemetry-failure-reasons";
import { createAssetExit, getAssetById } from "@/services/inventory";
import { getTelemetryUserId, track } from "@/services/telemetry";
import type { Asset, AssetExitCreateInput } from "@/types/inventory";

const EMPTY_FORM: Omit<AssetExitCreateInput, "asset_id"> = {
  quantity: 1,
  exit_type: "allocation",
  assigned_to: "",
  office: "Valencia",
};

interface AssetExitFormProps {
  assets: Asset[];
  initialAssetId?: number;
}

export function AssetExitForm({ assets, initialAssetId }: AssetExitFormProps) {
  const [assetId, setAssetId] = useState<number | "">(
    initialAssetId ?? "",
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const flowStartedRef = useRef(false);

  useEffect(() => {
    if (initialAssetId) {
      setAssetId(initialAssetId);
    }
  }, [initialAssetId]);

  useEffect(() => {
    if (flowStartedRef.current) {
      return;
    }
    flowStartedRef.current = true;
    const asset = assets.find((item) => item.id === initialAssetId);
    track("outbound_flow_started", {
      product_id: initialAssetId,
      product_category: normalizeCategory(asset?.category),
      programme_id: asset?.programme_id,
      office: normalizeOffice(form.office) ?? "valencia",
      currency: currencyForOffice(form.office),
      flow_origin: initialAssetId ? "asset_list" : "order_history",
    });
  }, [assets, form.office, initialAssetId]);

  useEffect(() => {
    if (!assetId) {
      setCurrentStock(null);
      return;
    }

    let cancelled = false;
    setStockLoading(true);

    getAssetById(assetId)
      .then((asset) => {
        if (!cancelled) {
          setCurrentStock(asset.current_stock);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentStock(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStockLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === assetId),
    [assets, assetId],
  );

  const quantityExceedsStock =
    currentStock !== null && form.quantity > currentStock;

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
      track("outbound_order_failed", {
        office,
        programme_id: programmeId,
        currency,
        failure_reason: "missing_asset",
      });
      return;
    }

    if (!form.quantity || form.quantity <= 0) {
      setError("Quantity must be greater than zero.");
      track("outbound_order_failed", {
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

    if (form.exit_type === "allocation" && !form.assigned_to?.trim()) {
      setError("Assigned to is required for allocation exits.");
      track("outbound_order_failed", {
        product_id: assetId,
        product_category: productCategory,
        programme_id: programmeId,
        office,
        quantity: form.quantity,
        currency,
        failure_reason: "missing_assigned_to",
      });
      return;
    }

    setSubmitting(true);

    try {
      const assignedTo =
        form.exit_type === "allocation" ? form.assigned_to?.trim() : null;
      const created = await createAssetExit({
        asset_id: assetId,
        quantity: form.quantity,
        exit_type: form.exit_type,
        assigned_to: assignedTo,
        office: form.office,
      });
      const materialProps = {
        product_id: created.asset_id,
        product_category:
          normalizeCategory(created.product_category) ??
          productCategory ??
          "training_kit",
        programme_id: created.programme_id || programmeId,
        office: normalizeOffice(created.office) ?? office,
        quantity: created.quantity,
        currency: created.currency || currency,
      };
      track("outbound_order_created", {
        outbound_order_id: created.id,
        ...materialProps,
        created_by: created.user_uuid || getTelemetryUserId(),
      });
      if (created.stock_threshold_triggered) {
        track("stock_threshold_triggered", {
          ...materialProps,
          current_stock: created.current_stock,
          reorder_threshold: created.reorder_threshold,
          trigger_source_order_id: created.id,
        });
      }
      setForm(EMPTY_FORM);
      setAssetId(initialAssetId ?? "");
      setCurrentStock(null);
      setSuccess("Asset exit registered successfully.");
    } catch (err) {
      const message =
        err instanceof InventoryApiError
          ? err.message
          : "Failed to register asset exit.";
      setError(message);
      track("outbound_order_failed", {
        product_id: assetId,
        product_category: productCategory,
        programme_id: programmeId,
        office,
        quantity: form.quantity,
        currency,
        failure_reason: mapAssignmentFailureReason(message),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Register Asset Exit
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

        {assetId ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 md:col-span-2">
            {stockLoading
              ? "Loading current stock..."
              : `Current stock: ${currentStock ?? "—"}`}
            {selectedAsset ? (
              <>
                {" · "}
                Programme: <strong>{selectedAsset.programme_id}</strong>
              </>
            ) : null}
          </p>
        ) : null}

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Exit type
          <select
            value={form.exit_type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                exit_type: event.target
                  .value as AssetExitCreateInput["exit_type"],
                assigned_to:
                  event.target.value === "consumption"
                    ? ""
                    : current.assigned_to,
              }))
            }
            className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {EXIT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          Office
          <select
            value={form.office}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                office: event.target.value as AssetExitCreateInput["office"],
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
          {quantityExceedsStock ? (
            <span
              role="alert"
              className="text-xs text-amber-700 dark:text-amber-300"
            >
              Warning: quantity exceeds available stock ({currentStock}).
            </span>
          ) : null}
        </label>

        {form.exit_type === "allocation" ? (
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
            Assigned to (opaque id)
            <input
              value={form.assigned_to ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  assigned_to: event.target.value,
                }))
              }
              className="rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              required
              placeholder="agent-uuid-…"
            />
          </label>
        ) : (
          <div />
        )}

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
            {submitting ? "Submitting..." : "Register Exit"}
          </button>
        </div>
      </form>

      {selectedAsset ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Registering exit for {selectedAsset.name}.
        </p>
      ) : null}
    </section>
  );
}
