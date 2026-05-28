import { Suspense } from "react";
import { CandidateListClient } from "@/components/candidates/CandidateListClient";

export default function CandidateListPage() {
  return (
    <Suspense fallback={<main className="p-6 text-slate-700">Loading page...</main>}>
      <CandidateListClient />
    </Suspense>
  );
}
