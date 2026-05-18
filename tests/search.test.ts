import { binarySearchCandidateBySalary, findCandidateByEmail, findCandidateById } from "../src/utils/search";
import { sortCandidatesBySalary } from "../src/utils/collections";
import { sampleCandidates } from "./fixtures/nexovaData";

describe("search utilities", () => {
  it("finds candidate by id using linear search", () => {
    const candidate = findCandidateById(sampleCandidates, "C-2024-0452");

    expect(candidate?.fullName).toBe("Juan Pérez");
  });

  it("returns null when id is not found", () => {
    expect(findCandidateById(sampleCandidates, "C-UNKNOWN")).toBeNull();
  });

  it("finds candidate by email case-insensitively", () => {
    const candidate = findCandidateByEmail(sampleCandidates, "CAROLINA.SILVA@EMAIL.COM");

    expect(candidate?.id).toBe("C-2024-0453");
  });

  it("returns null when email is not found", () => {
    expect(findCandidateByEmail(sampleCandidates, "missing@email.com")).toBeNull();
  });

  it("finds candidate salary index with binary search in sorted array", () => {
    const sorted = sortCandidatesBySalary(sampleCandidates, "asc");
    const index = binarySearchCandidateBySalary(sorted, 4200);

    expect(index).toBeGreaterThanOrEqual(0);
    expect(sorted[index]?.expectedSalary).toBe(4200);
  });

  it("returns -1 when salary is not found", () => {
    const sorted = sortCandidatesBySalary(sampleCandidates, "asc");
    const index = binarySearchCandidateBySalary(sorted, 9999);

    expect(index).toBe(-1);
  });
});
