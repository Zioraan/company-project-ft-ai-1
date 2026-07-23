"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { InventoryApiError } from "@/lib/inventory-api-client";
import { getOrderHistory } from "@/services/inventory";
import type { OrderHistoryItem } from "@/types/inventory";

interface UseInventoryOrdersOptions {
  initialData?: OrderHistoryItem[];
}

export function useInventoryOrders(options?: UseInventoryOrdersOptions) {
  const { data, error, isLoading, mutate } = useSWR<
    OrderHistoryItem[],
    InventoryApiError
  >("inventory-orders", () => getOrderHistory(), {
    fallbackData: options?.initialData,
    revalidateOnMount: !options?.initialData,
  });

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const errorMessage =
    error instanceof InventoryApiError
      ? error.message
      : error
        ? "Failed to load order history"
        : null;

  return {
    orders: data ?? [],
    loading: isLoading && !data,
    error: errorMessage,
    refetch,
  };
}
