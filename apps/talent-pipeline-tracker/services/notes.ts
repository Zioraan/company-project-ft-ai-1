import { apiRequest } from "@/lib/api-client";
import type { ApiNote, NotesListResponse } from "@/types/api";

export async function getNotes(recordId: string): Promise<NotesListResponse> {
  return apiRequest<NotesListResponse>(`/records/${recordId}/notes`);
}

export async function createNote(recordId: string, content: string): Promise<ApiNote> {
  return apiRequest<ApiNote>(`/records/${recordId}/notes`, {
    method: "POST",
    body: JSON.stringify({ content })
  });
}

export async function deleteNote(recordId: string, noteId: string): Promise<void> {
  await apiRequest<null>(`/records/${recordId}/notes/${noteId}`, {
    method: "DELETE"
  });
}
