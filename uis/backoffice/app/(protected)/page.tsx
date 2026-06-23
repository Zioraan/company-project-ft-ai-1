import { BackofficeDashboard } from "@/components/dashboard/BackofficeDashboard";

export default function BackofficeEntryPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4">
        <BackofficeDashboard />
      </div>
    </main>
  );
}
