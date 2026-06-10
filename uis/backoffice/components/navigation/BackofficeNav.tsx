import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/candidates", label: "Talent Pipeline" },
  { href: "/incidents/analysis", label: "Incident Analysis" },
];

export function BackofficeNav() {
  return (
    <nav className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Nexova Backoffice
        </span>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
