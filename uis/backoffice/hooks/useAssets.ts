"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { InventoryApiError } from "@/lib/inventory-api-client";
import { getAssets } from "@/services/inventory";
import type { Asset } from "@/types/inventory";

interface UseAssetsOptions {
  initialData?: Asset[];
}

export function useAssets(options?: UseAssetsOptions) {
  const { data, error, isLoading, mutate } = useSWR<Asset[], InventoryApiError>(
    "inventory-assets",
    () => getAssets(),
    {
      fallbackData: options?.initialData,
      revalidateOnMount: !options?.initialData,
    },
  );

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const errorMessage =
    error instanceof InventoryApiError
      ? error.message
      : error
        ? "Failed to load assets"
        : null;

  return {
    assets: data ?? [],
    loading: isLoading && !data,
    error: errorMessage,
    refetch,
  };
}
