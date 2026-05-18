import type { Candidate, SelectionProcess } from "../src/types/models";
import {
  calculateAverageSalary,
  calculateCandidateScore,
  calculateVacancyFillRate,
  countCandidatesByStatus,
  findTopSkills,
  groupCandidatesBySeniority,
  rankCandidatesForVacancy
} from "../src/utils/transformations";
import { sampleCandidates, sampleProcesses, sampleVacancy } from "./fixtures/nexovaData";

describe("transformations utilities", () => {
  it("calculates candidate score according to business rules", () => {
    const score = calculateCandidateScore(sampleCandidates[2]!, sampleVacancy);

    expect(score).toBe(100);
  });

  it("handles partial experience and salary tolerance scoring", () => {
    const baseCandidate = sampleCandidates[0]!;
    const customCandidate: Candidate = {
      ...baseCandidate,
      id: "C-CUSTOM",
      yearsOfExperience: 10,
      expectedSalary: 8200,
      skills: ["TypeScript", "React"],
      seniority: "Lead",
      englishLevel: "C1"
    };

    const score = calculateCandidateScore(customCandidate, sampleVacancy);

    expect(score).toBe(57);
  });

  it("ranks candidates by score descending", () => {
    const ranked = rankCandidatesForVacancy(sampleCandidates, sampleVacancy);

    expect(ranked[0]?.candidate.id).toBe("C-2024-0453");
    expect(ranked[1]?.score).toBeGreaterThanOrEqual(ranked[2]?.score ?? 0);
  });

  it("groups candidates by seniority with all keys present", () => {
    const grouped = groupCandidatesBySeniority(sampleCandidates);

    expect(Object.keys(grouped)).toEqual(["Junior", "Semi-Senior", "Senior", "Lead", "Executive"]);
    expect(grouped.Junior).toHaveLength(1);
    expect(grouped["Semi-Senior"]).toHaveLength(1);
    expect(grouped.Senior).toHaveLength(1);
    expect(grouped.Lead).toHaveLength(0);
  });

  it("counts candidates by status", () => {
    const counters = countCandidatesByStatus(sampleCandidates);

    expect(counters).toEqual({
      Active: 2,
      "In process": 1,
      Hired: 0,
      Inactive: 0
    });
  });

  it("calculates average expected salary with 2 decimals", () => {
    const average = calculateAverageSalary(sampleCandidates);

    expect(average).toBe(4500);
  });

  it("returns zero average salary for empty arrays", () => {
    expect(calculateAverageSalary([])).toBe(0);
  });

  it("finds top N skills by frequency", () => {
    const topSkills = findTopSkills(sampleCandidates, 3);

    expect(topSkills).toEqual([
      { skill: "node.js", count: 2 },
      { skill: "postgresql", count: 2 },
      { skill: "react", count: 2 }
    ]);
  });

  it("returns empty top skills when topN is zero", () => {
    expect(findTopSkills(sampleCandidates, 0)).toEqual([]);
  });

  it("calculates vacancy fill rate with rounding", () => {
    const baseProcess0 = sampleProcesses[0]!;
    const baseProcess1 = sampleProcesses[1]!;
    const processes: SelectionProcess[] = [
      ...sampleProcesses,
      {
        ...baseProcess0,
        id: "SP-EXTRA-1",
        stage: "Hired"
      },
      {
        ...baseProcess1,
        id: "SP-EXTRA-2",
        stage: "Interview"
      }
    ];

    expect(calculateVacancyFillRate(processes)).toBe(40);
  });

  it("returns zero fill rate for empty process list", () => {
    expect(calculateVacancyFillRate([])).toBe(0);
  });
});
