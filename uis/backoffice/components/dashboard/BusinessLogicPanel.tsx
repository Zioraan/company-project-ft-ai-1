import { findCandidateById } from "../../../../src/utils/search";
import { filterCandidatesBySkills } from "../../../../src/utils/collections";
import {
  calculateAverageSalary,
  calculateVacancyFillRate,
  countCandidatesByStatus,
  findTopSkills,
  rankCandidatesForVacancy,
} from "../../../../src/utils/transformations";
import { loadTalentSampleDataset } from "../../../../src/data/talent-sample-data";

export function BusinessLogicPanel() {
  const { candidates, vacancy, processes } = loadTalentSampleDataset();
  const ranked = rankCandidatesForVacancy(candidates, vacancy);
  const topSkills = findTopSkills(candidates, 3);
  const statusCounts = countCandidatesByStatus(candidates);
  const averageSalary = calculateAverageSalary(candidates);
  const fillRate = calculateVacancyFillRate(processes);
  const skilledMatches = filterCandidatesBySkills(
    candidates,
    vacancy.requiredSkills,
  );
  const featuredCandidate = findCandidateById(candidates, "C-2024-0453");

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/30">
      <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
        Milestone 2 Business Logic Snapshot
      </h2>
      <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
        Logic from <code>src/utils/*</code> · Data from{" "}
        <code>src/data/talent-sample-data.ts</code>
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Ranked for {vacancy.title}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {ranked.map((entry) => (
              <li key={entry.candidate.id}>
                {entry.candidate.fullName}:{" "}
                <span className="font-semibold">{entry.score}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Top Skills
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {topSkills.map((skill) => (
              <li key={skill.skill}>
                {skill.skill}:{" "}
                <span className="font-semibold">{skill.count}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Pipeline Metrics
          </h3>
          <dl className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <dt>Average expected salary</dt>
              <dd className="font-semibold">${averageSalary}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Vacancy fill rate</dt>
              <dd className="font-semibold">{fillRate}%</dd>
            </div>
            <div className="flex justify-between">
              <dt>Required-skill matches</dt>
              <dd className="font-semibold">{skilledMatches.length}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Candidates by Status
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <li
                key={status}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100"
              >
                {status}: {count}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Search Snapshot
          </h3>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Featured candidate lookup (
            <code>findCandidateById</code>):{" "}
            <span className="font-semibold">
              {featuredCandidate?.fullName ?? "Not found"}
            </span>
          </p>
        </article>
      </div>
    </section>
  );
}
