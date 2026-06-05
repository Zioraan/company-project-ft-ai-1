export type RecordStatus = "received" | "in_progress" | "selected" | "discarded";

export type RecordStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

export interface CandidateFilters {
  status?: RecordStatus;
  stage?: RecordStage;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CandidateFormValues {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: number;
}
