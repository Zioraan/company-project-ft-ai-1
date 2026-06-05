import type { NotesService, NotesServiceDeps } from "../contracts/notes";

export function createNotesService<TNote, TListResponse>(
  deps: NotesServiceDeps,
): NotesService<TNote, TListResponse> {
  const { apiRequest } = deps;

  return {
    async getNotes(recordId: string): Promise<TListResponse> {
      return apiRequest<TListResponse>(`/records/${recordId}/notes`);
    },

    async createNote(recordId: string, content: string): Promise<TNote> {
      return apiRequest<TNote>(`/records/${recordId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },

    async deleteNote(recordId: string, noteId: string): Promise<void> {
      await apiRequest<null>(`/records/${recordId}/notes/${noteId}`, {
        method: "DELETE",
      });
    },
  };
}
