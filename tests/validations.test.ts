import type { Candidate, Vacancy } from "../src/types/models";
import { isValidEmail, validateCandidate, validateVacancy } from "../src/utils/validations";
import { sampleCandidates, sampleVacancy } from "./fixtures/nexovaData";

describe("validations utilities", () => {
  it("validates a correct candidate", () => {
    const result = validateCandidate(sampleCandidates[0]!);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns multiple errors for an invalid candidate", () => {
    const baseCandidate = sampleCandidates[0]!;
    const invalidCandidate: Candidate = {
      ...baseCandidate,
      yearsOfExperience: 60,
      currentSalary: 0,
      expectedSalary: -1,
      skills: [],
      email: "invalid-email",
      phone: "   "
    };

    const result = validateCandidate(invalidCandidate);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(6);
  });

  it("validates a correct vacancy", () => {
    const result = validateVacancy(sampleVacancy);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns multiple errors for an invalid vacancy", () => {
    const invalidVacancy: Vacancy = {
      ...sampleVacancy,
      requiredSkills: [],
      minYearsExperience: -1,
      maxYearsExperience: -2,
      salaryRangeMin: 0,
      salaryRangeMax: -100
    };

    const result = validateVacancy(invalidVacancy);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      "requiredSkills must contain at least 1 skill.",
      "minYearsExperience must be greater than or equal to 0.",
      "maxYearsExperience must be greater than or equal to minYearsExperience.",
      "salaryRangeMin must be greater than 0.",
      "salaryRangeMax must be greater than 0.",
      "salaryRangeMax must be greater than or equal to salaryRangeMin."
    ]);
  });

  it("validates email with basic structure checks", () => {
    expect(isValidEmail("person@example.com")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("missingdot@example")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("person@.com")).toBe(false);
  });
});
