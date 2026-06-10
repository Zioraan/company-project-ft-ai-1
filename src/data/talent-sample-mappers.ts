import type { Candidate, SelectionProcess, Vacancy } from "../types/models";
import {
  loadTalentSampleDataset,
  sampleCandidates,
  sampleProcesses,
  sampleVacancy,
} from "./talent-sample-data";

export type CandidateRow = Omit<Candidate, never>;

export type VacancyRow = Omit<Vacancy, never>;

export type SelectionProcessRow = {
  id: string;
  candidateId: string;
  vacancyId: string;
  stage: SelectionProcess["stage"];
  score: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export function mapCandidateRowToDomain(row: CandidateRow): Candidate {
  return { ...row };
}

export function mapCandidateDomainToRow(candidate: Candidate): CandidateRow {
  return { ...candidate };
}

export function mapVacancyRowToDomain(row: VacancyRow): Vacancy {
  return { ...row };
}

export function mapVacancyDomainToRow(vacancy: Vacancy): VacancyRow {
  return { ...vacancy };
}

export function mapSelectionProcessRowToDomain(
  row: SelectionProcessRow,
): SelectionProcess {
  return {
    id: row.id,
    candidateId: row.candidateId,
    vacancyId: row.vacancyId,
    stage: row.stage,
    score: row.score,
    notes: row.notes,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export function mapSelectionProcessDomainToRow(
  process: SelectionProcess,
): SelectionProcessRow {
  return {
    id: process.id,
    candidateId: process.candidateId,
    vacancyId: process.vacancyId,
    stage: process.stage,
    score: process.score,
    notes: process.notes,
    createdAt: process.createdAt.toISOString(),
    updatedAt: process.updatedAt.toISOString(),
  };
}

export function exportTalentSeedRows() {
  return {
    candidates: sampleCandidates.map(mapCandidateDomainToRow),
    vacancies: [mapVacancyDomainToRow(sampleVacancy)],
    selectionProcesses: sampleProcesses.map(mapSelectionProcessDomainToRow),
  };
}

export function loadTalentSampleDatasetFromRows(rows: {
  candidates: CandidateRow[];
  vacancy: VacancyRow;
  processes: SelectionProcessRow[];
}) {
  return {
    candidates: rows.candidates.map(mapCandidateRowToDomain),
    vacancy: mapVacancyRowToDomain(rows.vacancy),
    processes: rows.processes.map(mapSelectionProcessRowToDomain),
  };
}

export { loadTalentSampleDataset };
