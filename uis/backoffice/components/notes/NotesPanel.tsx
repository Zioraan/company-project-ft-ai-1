"use client";

import { useState } from "react";
import type { ApiNote } from "@/types/api";

interface NotesPanelProps {
  notes: ApiNote[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  onAdd: (content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

export function NotesPanel({ notes, loading, saving, error, onAdd, onDelete }: NotesPanelProps) {
  const [content, setContent] = useState<string>("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    await onAdd(content.trim());
    setContent("");
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Internal Notes</h2>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a new note"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add note"}
        </button>
      </form>

      {loading && <p className="mt-3 text-sm text-slate-600">Loading notes...</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {!loading && notes.length === 0 && <p className="mt-3 text-sm text-slate-600">No notes yet.</p>}

      <ul className="mt-4 space-y-2">
        {notes.map((note) => (
          <li key={note.id} className="rounded border border-slate-200 p-3">
            <p className="text-sm text-slate-700">{note.content}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{new Date(note.created_at).toLocaleString()}</span>
              <button
                onClick={() => void onDelete(note.id)}
                disabled={saving}
                className="rounded bg-red-50 px-2 py-1 font-semibold text-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
