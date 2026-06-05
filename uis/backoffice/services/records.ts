import { apiRequest } from "@/lib/api-client";
import { buildRecordQuery } from "@/lib/query";
import type { ApiRecord, RecordsListResponse } from "@/types/api";
import type {
  CandidateFilters,
  CandidateFormValues,
  RecordStage,
  RecordStatus,
} from "@/types/domain";
import { createRecordsService } from "../../../services/domain/records";

const recordsService = createRecordsService<
  CandidateFilters,
  ApiRecord,
  CandidateFormValues,
  RecordStatus,
  RecordStage,
  RecordsListResponse
>({
  apiRequest,
  buildRecordQuery,
});

export const {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  patchRecordStatusStage,
  deleteRecord,
} = recordsService;
