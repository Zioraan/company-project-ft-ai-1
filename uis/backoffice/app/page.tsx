import { CandidateListClient } from "@/components/candidates/CandidateListClient";
import { BusinessLogicPanel } from "@/components/dashboard/BusinessLogicPanel";
import { getRecords } from "@/services/records";

export default async function CandidateListPage() {
  const initialData = await getRecords({ page: 1, limit: 20 });

  return (
    <main className="min-h-screen space-y-4 bg-slate-50 py-8">
      <BusinessLogicPanel />
      <CandidateListClient initialData={initialData} />
    </main>
  );
}
