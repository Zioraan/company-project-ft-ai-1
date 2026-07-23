import { CandidateListClient } from "@/components/candidates/CandidateListClient";
import { getRecords } from "@/services/records";

export default async function CandidateListPage() {
  let initialData;
  let initialError: string | undefined;

  try {
    initialData = await getRecords({ page: 1, limit: 20 });
  } catch {
    initialError = "Unable to load candidates. Please try again.";
  }

  return (
    <main className="min-h-screen space-y-4 bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Talent Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage candidate records, filters, and pipeline stages.
          </p>
        </header>
        <CandidateListClient initialData={initialData} initialError={initialError} />
      </div>
    </main>
  );
}
