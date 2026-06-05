import type { RecordsService, RecordsServiceDeps } from "../contracts/records";

export function createRecordsService<
  TFilters,
  TRecord,
  TCreateValues,
  TStatus,
  TStage,
  TListResponse,
>(
  deps: RecordsServiceDeps<TFilters>,
): RecordsService<
  TFilters,
  TRecord,
  TCreateValues,
  TStatus,
  TStage,
  TListResponse
> {
  const { apiRequest, buildRecordQuery } = deps;

  return {
    async getRecords(filters: TFilters): Promise<TListResponse> {
      const query = buildRecordQuery(filters);
      return apiRequest<TListResponse>(`/records?${query}`);
    },

    async getRecordById(id: string): Promise<TRecord> {
      return apiRequest<TRecord>(`/records/${id}`);
    },

    async createRecord(values: TCreateValues): Promise<TRecord> {
      return apiRequest<TRecord>("/records", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },

    async updateRecord(id: string, values: TCreateValues): Promise<TRecord> {
      return apiRequest<TRecord>(`/records/${id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
    },

    async patchRecordStatusStage(
      id: string,
      patch: { status: TStatus; stage: TStage },
    ): Promise<TRecord> {
      return apiRequest<TRecord>(`/records/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },

    async deleteRecord(id: string): Promise<void> {
      await apiRequest<null>(`/records/${id}`, {
        method: "DELETE",
      });
    },
  };
}
