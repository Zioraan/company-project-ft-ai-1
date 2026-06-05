import { apiRequest } from "@/lib/api-client";
import type { ApiNote, NotesListResponse } from "@/types/api";
import { createNotesService } from "../../../services/domain/notes";

const notesService = createNotesService<ApiNote, NotesListResponse>({
  apiRequest,
});

export const { getNotes, createNote, deleteNote } = notesService;
