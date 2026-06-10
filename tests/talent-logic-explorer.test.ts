import { describe, expect, it } from "vitest";
import { loadTalentSampleDataset } from "../src/data/talent-sample-data";
import {
  parseSkillsInput,
  runCandidateFilters,
  runCandidateSearch,
  runVacancyRanking,
} from "../uis/backoffice/lib/talent-logic-explorer";

describe("talent logic explorer", () => {
  const { candidates, vacancy } = loadTalentSampleDataset();

  it("parses comma-separated skills", () => {
    expect(parseSkillsInput("TypeScript, React , ")).toEqual([
      "TypeScript",
      "React",
    ]);
  });

  it("finds candidate by id", () => {
    const result = runCandidateSearch(candidates, {
      candidateId: "C-2024-0451",
      email: "",
      targetSalary: "",
    });

    expect(result.byId?.fullName).toBe("María González");
  });

  it("filters candidates by seniority and skills", () => {
    const result = runCandidateFilters(candidates, {
      skills: "TypeScript",
      seniority: "Senior",
      availability: [],
      sortField: "none",
      sortOrder: "asc",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.fullName).toBe("Carolina Silva");
  });

  it("ranks candidates for the sample vacancy", () => {
    const ranking = runVacancyRanking(candidates, vacancy);
    expect(ranking[0]?.candidate.fullName).toBe("Carolina Silva");
  });
});
