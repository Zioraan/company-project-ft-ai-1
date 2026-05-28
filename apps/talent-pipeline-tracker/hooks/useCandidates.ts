"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { getRecords } from "@/services/records";
import type { ApiRecord, RecordsListResponse } from "@/types/api";
import type { CandidateFilters } from "@/types/domain";

export function useCandidates(filters: CandidateFilters) {
  const [data, setData] = useState<RecordsListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRecords(filters);
      setData(response);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load candidates";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchCandidates();
  }, [fetchCandidates]);

  return {
    records: data?.data ?? ([] as ApiRecord[]),
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    loading,
    error,
    refetch: fetchCandidates
  };
}
