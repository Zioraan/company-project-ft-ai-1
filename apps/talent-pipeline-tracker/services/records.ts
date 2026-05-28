import { apiRequest } from "@/lib/api-client";
import { buildRecordQuery } from "@/lib/query";
import type { ApiRecord, RecordsListResponse } from "@/types/api";
import type { CandidateFilters, CandidateFormValues, RecordStage, RecordStatus } from "@/types/domain";

export async function getRecords(filters: CandidateFilters): Promise<RecordsListResponse> {
  const query = buildRecordQuery(filters);
  return apiRequest<RecordsListResponse>(`/records?${query}`);
}

export async function getRecordById(id: string): Promise<ApiRecord> {
  return apiRequest<ApiRecord>(`/records/${id}`);
}

export async function createRecord(values: CandidateFormValues): Promise<ApiRecord> {
  return apiRequest<ApiRecord>("/records", {
    method: "POST",
    body: JSON.stringify(values)
  });
}

export async function updateRecord(id: string, values: CandidateFormValues): Promise<ApiRecord> {
  return apiRequest<ApiRecord>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(values)
  });
}

export async function patchRecordStatusStage(
  id: string,
  patch: { status: RecordStatus; stage: RecordStage }
): Promise<ApiRecord> {
  return apiRequest<ApiRecord>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export async function deleteRecord(id: string): Promise<void> {
  await apiRequest<null>(`/records/${id}`, {
    method: "DELETE"
  });
}
