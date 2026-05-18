"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { deleteRecord, getRecordById, patchRecordStatusStage, updateRecord } from "@/services/records";
import type { ApiRecord } from "@/types/api";
import type { CandidateFormValues, RecordStage, RecordStatus } from "@/types/domain";

export function useCandidateDetail(id: string) {
  const [record, setRecord] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchRecord = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRecordById(id);
      setRecord(response);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load candidate";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  const saveFullRecord = useCallback(
    async (values: CandidateFormValues) => {
      setSaving(true);
      setError(null);

      try {
        const updated = await updateRecord(id, values);
        setRecord(updated);
        return updated;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to update candidate";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const saveStatusAndStage = useCallback(
    async (status: RecordStatus, stage: RecordStage) => {
      setSaving(true);
      setError(null);

      try {
        const updated = await patchRecordStatusStage(id, { status, stage });
        setRecord(updated);
        return updated;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to update status and stage";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const removeRecord = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      await deleteRecord(id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete candidate";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [id]);

  return {
    record,
    loading,
    saving,
    error,
    refetch: fetchRecord,
    saveFullRecord,
    saveStatusAndStage,
    removeRecord
  };
}
