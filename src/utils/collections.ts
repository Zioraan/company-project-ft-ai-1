import type { AvailabilityStatus, Candidate, SeniorityLevel } from "../types/models";

export function filterCandidatesBySkills(candidates: Candidate[], requiredSkills: string[]): Candidate[] {
  if (requiredSkills.length === 0) {
    return [...candidates];
  }

  const normalizedRequiredSkills = requiredSkills.map((skill) => skill.toLowerCase());

  return candidates.filter((candidate) => {
    const candidateSkills = candidate.skills.map((skill) => skill.toLowerCase());
    return normalizedRequiredSkills.every((requiredSkill) => candidateSkills.includes(requiredSkill));
  });
}

export function filterCandidatesBySeniority(candidates: Candidate[], seniority: SeniorityLevel): Candidate[] {
  return candidates.filter((candidate) => candidate.seniority === seniority);
}

export function filterCandidatesByAvailability(
  candidates: Candidate[],
  availability: AvailabilityStatus[]
): Candidate[] {
  if (availability.length === 0) {
    return [];
  }

  return candidates.filter((candidate) => availability.includes(candidate.availability));
}

export function sortCandidatesBySalary(candidates: Candidate[], order: "asc" | "desc"): Candidate[] {
  const sortedCandidates = [...candidates];
  const direction = order === "asc" ? 1 : -1;

  return sortedCandidates.sort((leftCandidate, rightCandidate) => {
    return (leftCandidate.expectedSalary - rightCandidate.expectedSalary) * direction;
  });
}

export function sortCandidatesByExperience(candidates: Candidate[], order: "asc" | "desc"): Candidate[] {
  const sortedCandidates = [...candidates];
  const direction = order === "asc" ? 1 : -1;

  return sortedCandidates.sort((leftCandidate, rightCandidate) => {
    return (leftCandidate.yearsOfExperience - rightCandidate.yearsOfExperience) * direction;
  });
}
