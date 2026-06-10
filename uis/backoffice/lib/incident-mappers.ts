import type {
  IncidentAnalysisApiResponse,
  IncidentAnalysisResult,
  IncidentBreakdownItem,
} from "../types/incidents";

const SATISFACTION_LABELS: Record<number, string> = {
  1: "Very dissatisfied",
  2: "Dissatisfied",
  3: "Neutral",
  4: "Satisfied",
  5: "Very satisfied",
};

export function getSatisfactionLabel(score: number): string {
  return SATISFACTION_LABELS[score] ?? `Score ${score}`;
}

function mapBreakdownItems(
  items: IncidentAnalysisApiResponse["by_category"],
): IncidentBreakdownItem[] {
  return items.map((item) => ({
    label: item.label,
    count: item.count,
    percentage: item.percentage ?? null,
  }));
}

export function mapIncidentAnalysisResponse(
  response: IncidentAnalysisApiResponse,
): IncidentAnalysisResult {
  const distribution = Object.fromEntries(
    Object.entries(response.satisfaction.distribution).map(([score, count]) => [
      Number(score),
      count,
    ]),
  ) as Record<number, number>;

  return {
    sourceName: response.source_name,
    totals: {
      totalRecords: response.totals.total_records,
      validCount: response.totals.valid_count,
      invalidCount: response.totals.invalid_count,
    },
    invalidBreakdown: mapBreakdownItems(response.invalid_breakdown),
    byCategory: mapBreakdownItems(response.by_category),
    byStatus: mapBreakdownItems(response.by_status),
    satisfaction: {
      scoredTickets: response.satisfaction.scored_tickets,
      closedTickets: response.satisfaction.closed_tickets,
      average: response.satisfaction.average,
      distribution,
    },
  };
}
