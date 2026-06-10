import { describe, expect, it } from "vitest";
import {
  getSatisfactionLabel,
  mapIncidentAnalysisResponse,
} from "../uis/backoffice/lib/incident-mappers";
import type { IncidentAnalysisApiResponse } from "../uis/backoffice/types/incidents";

describe("incident mappers", () => {
  it("maps API response into UI-friendly analysis result", () => {
    const response: IncidentAnalysisApiResponse = {
      source_name: "incidents-synthetic.csv",
      totals: {
        total_records: 10,
        valid_count: 3,
        invalid_count: 7,
      },
      invalid_breakdown: [
        { label: "Missing client_company", count: 1 },
      ],
      by_category: [{ label: "TECHNICAL", count: 2, percentage: 66.7 }],
      by_status: [{ label: "CLOSED", count: 2, percentage: 66.7 }],
      satisfaction: {
        scored_tickets: 2,
        closed_tickets: 2,
        average: 4.5,
        distribution: { "4": 1, "5": 1 },
      },
    };

    const result = mapIncidentAnalysisResponse(response);

    expect(result.sourceName).toBe("incidents-synthetic.csv");
    expect(result.totals.validCount).toBe(3);
    expect(result.satisfaction.distribution[4]).toBe(1);
    expect(result.satisfaction.distribution[5]).toBe(1);
  });

  it("returns satisfaction labels for known scores", () => {
    expect(getSatisfactionLabel(1)).toBe("Very dissatisfied");
    expect(getSatisfactionLabel(5)).toBe("Very satisfied");
  });
});
