import { getSatisfactionLabel } from "@/lib/incident-mappers";
import type { IncidentAnalysisResult } from "@/types/incidents";

type IncidentAnalysisSummaryProps = {
  result: IncidentAnalysisResult;
};

function BreakdownList({
  title,
  items,
}: {
  title: string;
  items: IncidentAnalysisResult["byCategory"];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between text-sm text-slate-800 dark:text-slate-100"
          >
            <span>{item.label}</span>
            <span className="font-medium">
              {item.count}
              {typeof item.percentage === "number"
                ? ` (${item.percentage.toFixed(1)}%)`
                : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IncidentAnalysisSummary({
  result,
}: IncidentAnalysisSummaryProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total records</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {result.totals.totalRecords}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">Valid records</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900 dark:text-emerald-100">
            {result.totals.validCount}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Invalid / incomplete
          </p>
          <p className="mt-2 text-3xl font-semibold text-amber-900 dark:text-amber-100">
            {result.totals.invalidCount}
          </p>
        </div>
      </section>

      {result.invalidBreakdown.length > 0 ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Invalid records breakdown
          </h3>
          <ul className="mt-4 space-y-2">
            {result.invalidBreakdown.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between text-sm text-amber-900 dark:text-amber-100"
              >
                <span>{item.label}</span>
                <span className="font-semibold">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownList title="Breakdown by category" items={result.byCategory} />
        <BreakdownList title="Breakdown by status" items={result.byStatus} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Satisfaction index (closed tickets)
        </h3>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          Scored tickets: {result.satisfaction.scoredTickets} of{" "}
          {result.satisfaction.closedTickets}
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Average score: {result.satisfaction.average.toFixed(2)} / 5.00
        </p>
        <ul className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <li
              key={score}
              className="flex items-center justify-between text-sm text-slate-800 dark:text-slate-100"
            >
              <span>
                Score {score} ({getSatisfactionLabel(score)})
              </span>
              <span className="font-medium">
                {result.satisfaction.distribution[score] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
