import { describe, expect, it } from "vitest";
import {
  mapCategoriesLabel,
  mapCategoryLabel,
  mapStatusLabel,
  supplierStatusVariant,
  isRenewalSoon,
} from "../uis/backoffice/lib/suppliers-mappers";

describe("suppliers mappers", () => {
  it("maps category values to display labels", () => {
    expect(mapCategoryLabel("job_boards")).toBe("Job Boards");
    expect(mapCategoryLabel("ats_software")).toBe("ATS Software");
  });

  it("maps multiple categories into a joined label", () => {
    expect(mapCategoriesLabel(["job_boards", "ats_software"])).toBe(
      "Job Boards, ATS Software",
    );
  });

  it("maps status values to display labels", () => {
    expect(mapStatusLabel("active")).toBe("Active");
    expect(mapStatusLabel("suspended")).toBe("Suspended");
  });

  it("returns status variants for styling", () => {
    expect(supplierStatusVariant("active")).toBe("active");
    expect(supplierStatusVariant("suspended")).toBe("suspended");
  });

  it("detects renewals within the next 60 days", () => {
    const referenceDate = new Date("2025-06-01T12:00:00Z");
    expect(isRenewalSoon("2025-07-01", referenceDate)).toBe(true);
    expect(isRenewalSoon("2026-01-01", referenceDate)).toBe(false);
    expect(isRenewalSoon(null, referenceDate)).toBe(false);
  });
});
