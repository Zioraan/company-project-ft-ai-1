"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { SuppliersApiError } from "@/lib/suppliers-api-client";
import { getSuppliers } from "@/services/suppliers";
import type { Supplier, SupplierFilters } from "@/types/suppliers";

interface UseSuppliersOptions {
  initialData?: Supplier[];
}

export function useSuppliers(
  filters: SupplierFilters,
  options?: UseSuppliersOptions,
) {
  const { data, error, isLoading, mutate } = useSWR<
    Supplier[],
    SuppliersApiError
  >(["suppliers", filters], () => getSuppliers(filters), {
    fallbackData: options?.initialData,
    revalidateOnMount: !options?.initialData,
  });

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const errorMessage =
    error instanceof SuppliersApiError
      ? error.message
      : error
        ? "Failed to load suppliers"
        : null;

  return {
    suppliers: data ?? [],
    loading: isLoading && !data,
    error: errorMessage,
    refetch,
  };
}
