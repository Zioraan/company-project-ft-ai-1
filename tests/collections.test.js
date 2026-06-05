import { filterCandidatesByAvailability, filterCandidatesBySeniority, filterCandidatesBySkills, sortCandidatesByExperience, sortCandidatesBySalary } from "../src/utils/collections";
import { sampleCandidates } from "./fixtures/nexovaData";
describe("collections utilities", () => {
    it("filters candidates by required skills case-insensitively", () => {
        const result = filterCandidatesBySkills(sampleCandidates, ["typescript", "react"]);
        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("C-2024-0451");
    });
    it("returns all candidates when required skills are empty", () => {
        const result = filterCandidatesBySkills(sampleCandidates, []);
        expect(result).toHaveLength(sampleCandidates.length);
        expect(result).not.toBe(sampleCandidates);
    });
    it("filters candidates by seniority", () => {
        const result = filterCandidatesBySeniority(sampleCandidates, "Senior");
        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("C-2024-0453");
    });
    it("filters candidates by any availability status", () => {
        const result = filterCandidatesByAvailability(sampleCandidates, ["Immediate", "2 weeks"]);
        expect(result.map((candidate) => candidate.id)).toEqual(["C-2024-0452", "C-2024-0453"]);
    });
    it("returns empty list for empty availability filter", () => {
        expect(filterCandidatesByAvailability(sampleCandidates, [])).toEqual([]);
    });
    it("sorts by salary without mutating original array", () => {
        const copy = [...sampleCandidates];
        const result = sortCandidatesBySalary(sampleCandidates, "asc");
        expect(result.map((candidate) => candidate.expectedSalary)).toEqual([2800, 4200, 6500]);
        expect(sampleCandidates).toEqual(copy);
    });
    it("sorts by experience descending without mutating original array", () => {
        const copy = [...sampleCandidates];
        const result = sortCandidatesByExperience(sampleCandidates, "desc");
        expect(result.map((candidate) => candidate.yearsOfExperience)).toEqual([8, 5, 3]);
        expect(sampleCandidates).toEqual(copy);
    });
});
