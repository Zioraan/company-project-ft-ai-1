import type { RecordStage, RecordStatus } from "@/types/domain";

export const STATUS_LABELS: Record<RecordStatus, string> = {
  received: "Received",
  in_progress: "In progress",
  selected: "Selected",
  discarded: "Discarded"
};

export const STAGE_LABELS: Record<RecordStage, string> = {
  pending: "Pending review",
  review: "Under review",
  personal_interview: "Personal interview",
  technical_interview: "Technical interview",
  offer_presented: "Offer presented"
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: value as RecordStatus,
  label
}));

export const STAGE_OPTIONS = Object.entries(STAGE_LABELS).map(([value, label]) => ({
  value: value as RecordStage,
  label
}));

export function mapStatusLabel(status: RecordStatus): string {
  return STATUS_LABELS[status];
}

export function mapStageLabel(stage: RecordStage): string {
  return STAGE_LABELS[stage];
}
