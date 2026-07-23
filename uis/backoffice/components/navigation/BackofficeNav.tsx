"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { logout } from "@/services/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/candidates", label: "Talent Pipeline" },
  { href: "/suppliers", label: "Supplier Directory" },
  { href: "/inventory/products", label: "Asset Inventory" },
  { href: "/inventory/orders", label: "Asset Orders" },
  { href: "/incidents/analysis", label: "Incident Analysis" },
  { href: "/account/profile", label: "Account" },
];

export function BackofficeNav() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <nav className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <div className="flex items-center gap-6">
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
        <button
          className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
