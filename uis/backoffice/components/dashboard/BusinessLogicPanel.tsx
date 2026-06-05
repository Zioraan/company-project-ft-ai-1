import {
  calculateCandidateScore,
  findTopSkills,
} from "../../../../src/utils/transformations";
import {
  milestoneDemoCandidates,
  milestoneDemoVacancy,
} from "@/lib/milestone-demo-data";

export function BusinessLogicPanel() {
  const ranked = milestoneDemoCandidates
    .map((candidate) => ({
      candidate,
      score: calculateCandidateScore(candidate, milestoneDemoVacancy),
    }))
    .sort((left, right) => right.score - left.score);

  const topSkills = findTopSkills(milestoneDemoCandidates, 3);

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h2 className="text-lg font-semibold text-blue-900">
        Milestone 2 Business Logic Snapshot
      </h2>
      <p className="mt-1 text-sm text-blue-800">
        Values below are computed using logic imported from the root business
        module in
        <code> src/utils/transformations.ts</code>.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <article className="rounded border border-blue-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Top Candidate Match Scores
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {ranked.slice(0, 3).map((entry) => (
              <li key={entry.candidate.id}>
                {entry.candidate.fullName}:{" "}
                <span className="font-semibold">{entry.score}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded border border-blue-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Most Common Skills
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {topSkills.map((skill) => (
              <li key={skill.skill}>
                {skill.skill}:{" "}
                <span className="font-semibold">{skill.count}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
