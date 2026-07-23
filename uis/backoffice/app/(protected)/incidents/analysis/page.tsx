import { IncidentAnalysisClient } from "@/components/incidents/IncidentAnalysisClient";

export default function IncidentAnalysisPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4">
        <IncidentAnalysisClient />
      </div>
    </main>
  );
}
