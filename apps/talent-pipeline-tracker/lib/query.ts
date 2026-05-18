import type { CandidateFilters, RecordStage, RecordStatus } from "@/types/domain";

export function buildRecordQuery(filters: CandidateFilters): string {
  const query = new URLSearchParams();

  if (filters.status) {
    query.set("status", filters.status);
  }

  if (filters.stage) {
    query.set("stage", filters.stage);
  }

  if (filters.search?.trim()) {
    query.set("search", filters.search.trim());
  }

  query.set("page", String(filters.page ?? 1));
  query.set("limit", String(filters.limit ?? 20));

  return query.toString();
}

export function parseFiltersFromSearchParams(params: URLSearchParams): CandidateFilters {
  const status = params.get("status") as RecordStatus | null;
  const stage = params.get("stage") as RecordStage | null;
  const search = params.get("search");
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);

  return {
    status: status ?? undefined,
    stage: stage ?? undefined,
    search: search ?? undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 20
  };
}
