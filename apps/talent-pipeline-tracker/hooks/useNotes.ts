"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { createNote, deleteNote, getNotes } from "@/services/notes";
import type { ApiNote } from "@/types/api";

export function useNotes(recordId: string) {
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getNotes(recordId);
      setNotes(response.data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load notes";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(
    async (content: string) => {
      setSaving(true);
      setError(null);

      try {
        await createNote(recordId, content);
        await fetchNotes();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to add note";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [recordId, fetchNotes]
  );

  const removeNote = useCallback(
    async (noteId: string) => {
      setSaving(true);
      setError(null);

      try {
        await deleteNote(recordId, noteId);
        await fetchNotes();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to delete note";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [recordId, fetchNotes]
  );

  return {
    notes,
    loading,
    saving,
    error,
    refetch: fetchNotes,
    addNote,
    removeNote
  };
}
