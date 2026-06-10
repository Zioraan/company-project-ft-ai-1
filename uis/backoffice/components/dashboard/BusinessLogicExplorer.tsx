"use client";

import { useMemo, useState } from "react";
import type {
  AvailabilityStatus,
  SeniorityLevel,
} from "../../../../src/types/models";
import { loadTalentSampleDataset } from "../../../../src/data/talent-sample-data";
import {
  runCandidateFilters,
  runCandidateSearch,
  runCandidateVacancyScore,
  runFillRate,
  runTopSkills,
  runVacancyRanking,
  type ExplorerFilterInput,
  type ExplorerSearchInput,
  type SortField,
  type SortOrder,
} from "@/lib/talent-logic-explorer";

const SENIORITY_OPTIONS: SeniorityLevel[] = [
  "Junior",
  "Semi-Senior",
  "Senior",
  "Lead",
  "Executive",
];

const AVAILABILITY_OPTIONS: AvailabilityStatus[] = [
  "Immediate",
  "2 weeks",
  "1 month",
  "Not available",
];

const inputClassName =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

const labelClassName =
  "text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";

export function BusinessLogicExplorer() {
  const dataset = useMemo(() => loadTalentSampleDataset(), []);
  const { candidates, vacancy, processes } = dataset;

  const [searchInput, setSearchInput] = useState<ExplorerSearchInput>({
    candidateId: "",
    email: "",
    targetSalary: "",
  });

  const [filterInput, setFilterInput] = useState<ExplorerFilterInput>({
    skills: "",
    seniority: "",
    availability: [],
    sortField: "none",
    sortOrder: "asc",
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState(
    candidates[0]?.id ?? "",
  );
  const [topSkillsCount, setTopSkillsCount] = useState(3);

  const searchResults = useMemo(
    () => runCandidateSearch(candidates, searchInput),
    [candidates, searchInput],
  );

  const filteredCandidates = useMemo(
    () => runCandidateFilters(candidates, filterInput),
    [candidates, filterInput],
  );

  const ranking = useMemo(
    () => runVacancyRanking(candidates, vacancy),
    [candidates, vacancy],
  );

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    null;

  const selectedScore = selectedCandidate
    ? runCandidateVacancyScore(selectedCandidate, vacancy)
    : null;

  const topSkills = useMemo(
    () => runTopSkills(candidates, topSkillsCount),
    [candidates, topSkillsCount],
  );

  const fillRate = useMemo(() => runFillRate(processes), [processes]);

  function toggleAvailability(value: AvailabilityStatus) {
    setFilterInput((current) => {
      const exists = current.availability.includes(value);
      return {
        ...current,
        availability: exists
          ? current.availability.filter((item) => item !== value)
          : [...current.availability, value],
      };
    });
  }

  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-800 dark:bg-indigo-950/20">
      <h2 className="text-lg font-semibold text-indigo-950 dark:text-indigo-100">
        Milestone 2 Logic Explorer
      </h2>
      <p className="mt-1 text-sm text-indigo-900/80 dark:text-indigo-200">
        Adjust the inputs below to run live queries against{" "}
        <code>src/utils/collections.ts</code>, <code>search.ts</code>, and{" "}
        <code>transformations.ts</code>.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-indigo-200 bg-white p-4 dark:border-indigo-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Search utilities
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelClassName}>Candidate ID</span>
              <input
                className={inputClassName}
                placeholder="C-2024-0451"
                value={searchInput.candidateId}
                onChange={(event) =>
                  setSearchInput((current) => ({
                    ...current,
                    candidateId: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Email</span>
              <input
                className={inputClassName}
                placeholder="maria.gonzalez@email.com"
                value={searchInput.email}
                onChange={(event) =>
                  setSearchInput((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClassName}>
                Target salary (binary search)
              </span>
              <input
                className={inputClassName}
                type="number"
                placeholder="4200"
                value={searchInput.targetSalary}
                onChange={(event) =>
                  setSearchInput((current) => ({
                    ...current,
                    targetSalary: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <dl className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <div>
              <dt className="font-medium">findCandidateById</dt>
              <dd>{searchResults.byId?.fullName ?? "No match"}</dd>
            </div>
            <div>
              <dt className="font-medium">findCandidateByEmail</dt>
              <dd>{searchResults.byEmail?.fullName ?? "No match"}</dd>
            </div>
            <div>
              <dt className="font-medium">binarySearchCandidateBySalary</dt>
              <dd>
                {searchResults.salaryIndex >= 0
                  ? `Index ${searchResults.salaryIndex} — ${searchResults.salaryMatch?.fullName}`
                  : "No match"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-lg border border-indigo-200 bg-white p-4 dark:border-indigo-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Filter and sort utilities
          </h3>
          <div className="mt-3 grid gap-3">
            <label className="block">
              <span className={labelClassName}>
                Required skills (comma-separated)
              </span>
              <input
                className={inputClassName}
                placeholder="TypeScript, React"
                value={filterInput.skills}
                onChange={(event) =>
                  setFilterInput((current) => ({
                    ...current,
                    skills: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Seniority</span>
              <select
                className={inputClassName}
                value={filterInput.seniority}
                onChange={(event) =>
                  setFilterInput((current) => ({
                    ...current,
                    seniority: event.target.value as SeniorityLevel | "",
                  }))
                }
              >
                <option value="">Any seniority</option>
                {SENIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className={labelClassName}>Availability</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map((option) => {
                  const checked = filterInput.availability.includes(option);
                  return (
                    <label
                      key={option}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${
                        checked
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleAvailability(option)}
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClassName}>Sort by</span>
                <select
                  className={inputClassName}
                  value={filterInput.sortField}
                  onChange={(event) =>
                    setFilterInput((current) => ({
                      ...current,
                      sortField: event.target.value as SortField,
                    }))
                  }
                >
                  <option value="none">No sorting</option>
                  <option value="salary">Expected salary</option>
                  <option value="experience">Years of experience</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClassName}>Sort order</span>
                <select
                  className={inputClassName}
                  value={filterInput.sortOrder}
                  onChange={(event) =>
                    setFilterInput((current) => ({
                      ...current,
                      sortOrder: event.target.value as SortOrder,
                    }))
                  }
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </label>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <li key={candidate.id}>
                  {candidate.fullName} — {candidate.seniority} — $
                  {candidate.expectedSalary}
                </li>
              ))
            ) : (
              <li>No candidates match the current filters.</li>
            )}
          </ul>
        </article>

        <article className="rounded-lg border border-indigo-200 bg-white p-4 dark:border-indigo-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Scoring utilities
          </h3>
          <label className="mt-3 block">
            <span className={labelClassName}>Candidate</span>
            <select
              className={inputClassName}
              value={selectedCandidateId}
              onChange={(event) => setSelectedCandidateId(event.target.value)}
            >
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">calculateCandidateScore</span> for{" "}
            {vacancy.title}:{" "}
            <span className="font-semibold">{selectedScore ?? "—"}</span> / 100
          </p>
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            rankCandidatesForVacancy
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {ranking.map((entry) => (
              <li key={entry.candidate.id}>
                {entry.candidate.fullName}: {entry.score}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-indigo-200 bg-white p-4 dark:border-indigo-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Reporting utilities
          </h3>
          <label className="mt-3 block">
            <span className={labelClassName}>Top skills count</span>
            <input
              className={inputClassName}
              type="number"
              min={1}
              max={10}
              value={topSkillsCount}
              onChange={(event) =>
                setTopSkillsCount(Math.max(1, Number(event.target.value) || 1))
              }
            />
          </label>
          <ul className="mt-4 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {topSkills.map((skill) => (
              <li key={skill.skill}>
                {skill.skill}: {skill.count}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">calculateVacancyFillRate:</span>{" "}
            <span className="font-semibold">{fillRate}%</span>
          </p>
        </article>
      </div>
    </section>
  );
}
