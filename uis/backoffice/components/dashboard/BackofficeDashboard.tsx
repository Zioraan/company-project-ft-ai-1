import Link from "next/link";
import { BusinessLogicExplorer } from "@/components/dashboard/BusinessLogicExplorer";
import { BusinessLogicPanel } from "@/components/dashboard/BusinessLogicPanel";

const quickLinks = [
  {
    href: "/candidates",
    title: "Talent Pipeline",
    description: "View, filter, and manage candidate records and pipeline stages.",
  },
  {
    href: "/incidents/analysis",
    title: "Incident Analysis",
    description: "Upload support ticket CSVs and review data integrity metrics.",
  },
];

export function BackofficeDashboard() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Nexova Backoffice
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Internal operations hub for talent selection and customer support
          workflows. Milestone 2 business logic runs on this entry dashboard
          using shared root modules.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {link.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {link.description}
            </p>
          </Link>
        ))}
      </section>

      <BusinessLogicPanel />
      <BusinessLogicExplorer />
    </div>
  );
}
