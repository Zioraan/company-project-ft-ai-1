"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { ApiError } from "@/lib/api-client";
import { createNote, deleteNote, getNotes } from "@/services/notes";
import type { ApiNote, NotesListResponse } from "@/types/api";

interface UseNotesOptions {
  initialNotes?: ApiNote[];
}

export function useNotes(recordId: string, options?: UseNotesOptions) {
  const fallbackData: NotesListResponse | undefined =
    options?.initialNotes === undefined
      ? undefined
      : {
          data: options.initialNotes,
          meta: {
            total: options.initialNotes.length,
          },
        };

  const {
    data,
    error: queryError,
    isLoading,
    mutate,
  } = useSWR<NotesListResponse, ApiError>(
    recordId ? ["notes", recordId] : null,
    () => getNotes(recordId),
    {
      fallbackData,
      revalidateOnMount:
        options?.initialNotes !== undefined ? false : undefined,
    },
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const addNote = useCallback(
    async (content: string) => {
      setSaving(true);
      setError(null);

      try {
        await createNote(recordId, content);
        await mutate();
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to add note";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [recordId, mutate],
  );

  const removeNote = useCallback(
    async (noteId: string) => {
      setSaving(true);
      setError(null);

      try {
        await deleteNote(recordId, noteId);
        await mutate();
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to delete note";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [recordId, mutate],
  );

  const queryErrorMessage =
    queryError instanceof ApiError
      ? queryError.message
      : queryError
        ? "Failed to load notes"
        : null;

  return {
    notes: data?.data ?? ([] as ApiNote[]),
    loading: isLoading && !data,
    saving,
    error: error ?? queryErrorMessage,
    refetch,
    addNote,
    removeNote,
  };
}
