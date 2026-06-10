import type {
  AvailabilityStatus,
  Candidate,
  SeniorityLevel,
  Vacancy,
} from "../../../src/types/models";
import {
  filterCandidatesByAvailability,
  filterCandidatesBySeniority,
  filterCandidatesBySkills,
  sortCandidatesByExperience,
  sortCandidatesBySalary,
} from "../../../src/utils/collections";
import {
  binarySearchCandidateBySalary,
  findCandidateByEmail,
  findCandidateById,
} from "../../../src/utils/search";
import {
  calculateCandidateScore,
  calculateVacancyFillRate,
  findTopSkills,
  rankCandidatesForVacancy,
} from "../../../src/utils/transformations";

export type SortField = "salary" | "experience" | "none";
export type SortOrder = "asc" | "desc";

export type ExplorerFilterInput = {
  skills: string;
  seniority: SeniorityLevel | "";
  availability: AvailabilityStatus[];
  sortField: SortField;
  sortOrder: SortOrder;
};

export type ExplorerSearchInput = {
  candidateId: string;
  email: string;
  targetSalary: string;
};

export function parseSkillsInput(raw: string): string[] {
  return raw
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function runCandidateSearch(
  candidates: Candidate[],
  input: ExplorerSearchInput,
) {
  const id = input.candidateId.trim();
  const email = input.email.trim();
  const salary = Number(input.targetSalary);

  const byId = id ? findCandidateById(candidates, id) : null;
  const byEmail = email ? findCandidateByEmail(candidates, email) : null;

  let salaryIndex = -1;
  let salaryMatch: Candidate | null = null;

  if (!Number.isNaN(salary) && input.targetSalary.trim()) {
    const sorted = sortCandidatesBySalary(candidates, "asc");
    salaryIndex = binarySearchCandidateBySalary(sorted, salary);
    salaryMatch = salaryIndex >= 0 ? (sorted[salaryIndex] ?? null) : null;
  }

  return { byId, byEmail, salaryIndex, salaryMatch };
}

export function runCandidateFilters(
  candidates: Candidate[],
  input: ExplorerFilterInput,
) {
  let results = [...candidates];
  const skills = parseSkillsInput(input.skills);

  if (skills.length > 0) {
    results = filterCandidatesBySkills(results, skills);
  }

  if (input.seniority) {
    results = filterCandidatesBySeniority(results, input.seniority);
  }

  if (input.availability.length > 0) {
    results = filterCandidatesByAvailability(results, input.availability);
  }

  if (input.sortField === "salary") {
    results = sortCandidatesBySalary(results, input.sortOrder);
  } else if (input.sortField === "experience") {
    results = sortCandidatesByExperience(results, input.sortOrder);
  }

  return results;
}

export function runVacancyRanking(candidates: Candidate[], vacancy: Vacancy) {
  return rankCandidatesForVacancy(candidates, vacancy);
}

export function runCandidateVacancyScore(
  candidate: Candidate,
  vacancy: Vacancy,
) {
  return calculateCandidateScore(candidate, vacancy);
}

export function runTopSkills(candidates: Candidate[], topN: number) {
  return findTopSkills(candidates, topN);
}

export function runFillRate(
  processes: Parameters<typeof calculateVacancyFillRate>[0],
) {
  return calculateVacancyFillRate(processes);
}
