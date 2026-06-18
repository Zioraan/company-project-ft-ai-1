"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { SuppliersApiError } from "@/lib/suppliers-api-client";
import {
  deleteSupplier,
  getSupplierById,
  updateSupplierRate,
  updateSupplierStatus,
} from "@/services/suppliers";
import type {
  Supplier,
  SupplierRateUpdateInput,
  SupplierStatus,
} from "@/types/suppliers";

interface UseSupplierDetailOptions {
  initialSupplier?: Supplier | null;
}

export function useSupplierDetail(
  id: string,
  options?: UseSupplierDetailOptions,
) {
  const {
    data: supplier,
    error: queryError,
    isLoading,
    mutate,
  } = useSWR<Supplier, SuppliersApiError>(
    id ? ["supplier", id] : null,
    () => getSupplierById(id),
    {
      fallbackData: options?.initialSupplier ?? undefined,
      revalidateOnMount:
        options?.initialSupplier !== undefined ? false : undefined,
    },
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const saveRate = useCallback(
    async (input: SupplierRateUpdateInput) => {
      setSaving(true);
      setError(null);

      try {
        const updated = await updateSupplierRate(id, input);
        await mutate(updated, { revalidate: false });
        return updated;
      } catch (err) {
        const message =
          err instanceof SuppliersApiError
            ? err.message
            : "Failed to update supplier rate";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [id, mutate],
  );

  const saveStatus = useCallback(
    async (status: SupplierStatus) => {
      setSaving(true);
      setError(null);

      try {
        const updated = await updateSupplierStatus(id, { status });
        await mutate(updated, { revalidate: false });
        return updated;
      } catch (err) {
        const message =
          err instanceof SuppliersApiError
            ? err.message
            : "Failed to update supplier status";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [id, mutate],
  );

  const removeSupplier = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      await deleteSupplier(id);
      await mutate(undefined, { revalidate: false });
    } catch (err) {
      const message =
        err instanceof SuppliersApiError
          ? err.message
          : "Failed to delete supplier";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [id, mutate]);

  const queryErrorMessage =
    queryError instanceof SuppliersApiError
      ? queryError.message
      : queryError
        ? "Failed to load supplier"
        : null;

  return {
    supplier,
    loading: isLoading && !supplier,
    saving,
    error: error ?? queryErrorMessage,
    refetch,
    saveRate,
    saveStatus,
    removeSupplier,
  };
}
