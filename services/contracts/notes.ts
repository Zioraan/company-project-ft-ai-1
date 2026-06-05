export interface NotesService<TNote, TListResponse> {
  getNotes(recordId: string): Promise<TListResponse>;
  createNote(recordId: string, content: string): Promise<TNote>;
  deleteNote(recordId: string, noteId: string): Promise<void>;
}

export interface NotesServiceDeps {
  apiRequest: <TResponse>(
    path: string,
    init?: RequestInit,
  ) => Promise<TResponse>;
}
