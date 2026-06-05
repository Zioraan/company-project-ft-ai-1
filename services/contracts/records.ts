export interface RecordsService<
  TFilters,
  TRecord,
  TCreateValues,
  TStatus,
  TStage,
  TListResponse,
> {
  getRecords(filters: TFilters): Promise<TListResponse>;
  getRecordById(id: string): Promise<TRecord>;
  createRecord(values: TCreateValues): Promise<TRecord>;
  updateRecord(id: string, values: TCreateValues): Promise<TRecord>;
  patchRecordStatusStage(
    id: string,
    patch: { status: TStatus; stage: TStage },
  ): Promise<TRecord>;
  deleteRecord(id: string): Promise<void>;
}

export interface RecordsServiceDeps<TFilters> {
  apiRequest: <TResponse>(
    path: string,
    init?: RequestInit,
  ) => Promise<TResponse>;
  buildRecordQuery: (filters: TFilters) => string;
}
