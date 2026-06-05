import type { RecordStage, RecordStatus } from "./domain";

export interface ApiNote {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

export interface ApiRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string;
  status: RecordStatus;
  stage: RecordStage;
  experience_years: number;
  notes_count: number;
  notes?: ApiNote[];
  applied_at: string;
  updated_at: string;
}

export interface RecordsListResponse {
  total: number;
  page: number;
  limit: number;
  data: ApiRecord[];
}

export interface NotesListResponse {
  data: ApiNote[];
  meta: {
    total: number;
  };
}

export interface ValidationErrorResponse {
  detail: Array<{
    loc: Array<string | number>;
    msg: string;
    type: string;
  }>;
}

export interface NotFoundErrorResponse {
  error: string;
}
