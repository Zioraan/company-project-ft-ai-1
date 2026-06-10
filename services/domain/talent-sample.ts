import {
  loadTalentSampleDataset,
  type TalentSampleDataset,
} from "../../src/data/talent-sample-data";
import type { Candidate, SelectionProcess, Vacancy } from "../../src/types/models";

export type TalentDataProvider = {
  getCandidates(): Promise<Candidate[]>;
  getVacancy(id: string): Promise<Vacancy | null>;
  getProcesses(): Promise<SelectionProcess[]>;
  getDataset(): Promise<TalentSampleDataset>;
};

export function createInMemoryTalentProvider(
  dataset: TalentSampleDataset = loadTalentSampleDataset(),
): TalentDataProvider {
  return {
    async getCandidates() {
      return dataset.candidates;
    },
    async getVacancy(id: string) {
      return dataset.vacancy.id === id ? dataset.vacancy : null;
    },
    async getProcesses() {
      return dataset.processes;
    },
    async getDataset() {
      return dataset;
    },
  };
}
