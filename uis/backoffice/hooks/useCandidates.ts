"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { ApiError } from "@/lib/api-client";
import { getRecords } from "@/services/records";
import type { ApiRecord, RecordsListResponse } from "@/types/api";
import type { CandidateFilters } from "@/types/domain";

interface UseCandidatesOptions {
  initialData?: RecordsListResponse;
}

export function useCandidates(
  filters: CandidateFilters,
  options?: UseCandidatesOptions,
) {
  const { data, error, isLoading, mutate } = useSWR<
    RecordsListResponse,
    ApiError
  >(["records", filters], () => getRecords(filters), {
    fallbackData: options?.initialData,
    revalidateOnMount: options?.initialData ? false : undefined,
  });

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error
        ? "Failed to load candidates"
        : null;

  return {
    records: data?.data ?? ([] as ApiRecord[]),
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    loading: isLoading && !data,
    error: errorMessage,
    refetch,
  };
}
