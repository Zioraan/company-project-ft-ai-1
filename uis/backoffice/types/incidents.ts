export type IncidentBreakdownItem = {
  label: string;
  count: number;
  percentage?: number | null;
};

export type IncidentTotals = {
  totalRecords: number;
  validCount: number;
  invalidCount: number;
};

export type IncidentSatisfaction = {
  scoredTickets: number;
  closedTickets: number;
  average: number;
  distribution: Record<number, number>;
};

export type IncidentAnalysisResult = {
  sourceName: string;
  totals: IncidentTotals;
  invalidBreakdown: IncidentBreakdownItem[];
  byCategory: IncidentBreakdownItem[];
  byStatus: IncidentBreakdownItem[];
  satisfaction: IncidentSatisfaction;
};

export type IncidentAnalysisApiResponse = {
  source_name: string;
  totals: {
    total_records: number;
    valid_count: number;
    invalid_count: number;
  };
  invalid_breakdown: Array<{
    label: string;
    count: number;
    percentage?: number | null;
  }>;
  by_category: Array<{
    label: string;
    count: number;
    percentage?: number | null;
  }>;
  by_status: Array<{
    label: string;
    count: number;
    percentage?: number | null;
  }>;
  satisfaction: {
    scored_tickets: number;
    closed_tickets: number;
    average: number;
    distribution: Record<string, number>;
  };
};
