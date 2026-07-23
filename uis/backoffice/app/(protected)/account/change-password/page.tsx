import Link from "next/link";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Change password
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Update your account password.
          </p>
        </header>
        <ChangePasswordForm />
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          <Link className="font-medium text-slate-900 hover:underline dark:text-slate-100" href="/account/profile">
            Back to profile
          </Link>
        </p>
      </div>
    </main>
  );
}
