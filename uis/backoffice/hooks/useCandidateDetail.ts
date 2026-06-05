"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { ApiError } from "@/lib/api-client";
import {
  deleteRecord,
  getRecordById,
  patchRecordStatusStage,
  updateRecord,
} from "@/services/records";
import type { ApiRecord } from "@/types/api";
import type {
  CandidateFormValues,
  RecordStage,
  RecordStatus,
} from "@/types/domain";

interface UseCandidateDetailOptions {
  initialRecord?: ApiRecord | null;
}

export function useCandidateDetail(
  id: string,
  options?: UseCandidateDetailOptions,
) {
  const {
    data: record,
    error: queryError,
    isLoading,
    mutate,
  } = useSWR<ApiRecord, ApiError>(
    id ? ["record", id] : null,
    () => getRecordById(id),
    {
      fallbackData: options?.initialRecord ?? undefined,
      revalidateOnMount:
        options?.initialRecord !== undefined ? false : undefined,
    },
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const saveFullRecord = useCallback(
    async (values: CandidateFormValues) => {
      setSaving(true);
      setError(null);

      try {
        const updated = await updateRecord(id, values);
        await mutate(updated, { revalidate: false });
        return updated;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to update candidate";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [id, mutate],
  );

  const saveStatusAndStage = useCallback(
    async (status: RecordStatus, stage: RecordStage) => {
      setSaving(true);
      setError(null);

      try {
        const updated = await patchRecordStatusStage(id, { status, stage });
        await mutate(updated, { revalidate: false });
        return updated;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to update status and stage";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [id, mutate],
  );

  const removeRecord = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      await deleteRecord(id);
      await mutate(undefined, { revalidate: false });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete candidate";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [id, mutate]);

  const queryErrorMessage =
    queryError instanceof ApiError
      ? queryError.message
      : queryError
        ? "Failed to load candidate"
        : null;

  return {
    record,
    loading: isLoading && !record,
    saving,
    error: error ?? queryErrorMessage,
    refetch,
    saveFullRecord,
    saveStatusAndStage,
    removeRecord,
  };
}
