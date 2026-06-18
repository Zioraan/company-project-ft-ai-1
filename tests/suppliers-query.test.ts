import { describe, expect, it } from "vitest";
import {
  buildSupplierQuery,
  parseSupplierFiltersFromSearchParams,
  serializeSupplierFiltersToSearchParams,
} from "../uis/backoffice/lib/suppliers-query";

describe("suppliers query", () => {
  it("builds query strings from filters", () => {
    expect(
      buildSupplierQuery({ country: "Spain", category: "ats_software" }),
    ).toBe("country=Spain&category=ats_software");
    expect(buildSupplierQuery({})).toBe("");
  });

  it("parses filters from search params", () => {
    const params = new URLSearchParams(
      "country=USA&category=job_boards&ignored=value",
    );

    expect(parseSupplierFiltersFromSearchParams(params)).toEqual({
      country: "USA",
      category: "job_boards",
    });
  });

  it("ignores invalid filter values when parsing", () => {
    const params = new URLSearchParams("country=Invalid&category=unknown");

    expect(parseSupplierFiltersFromSearchParams(params)).toEqual({});
  });

  it("serializes filters back into search params", () => {
    const params = serializeSupplierFiltersToSearchParams({
      country: "Spain",
      category: "training_platforms",
    });

    expect(params.toString()).toBe(
      "country=Spain&category=training_platforms",
    );
  });
});
