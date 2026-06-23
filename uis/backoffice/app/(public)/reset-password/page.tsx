import { Suspense } from "react";

import { PublicAuthLayout } from "@/components/auth/PublicAuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <PublicAuthLayout
      title="Reset password"
      subtitle="Choose a new password for your account."
    >
      <Suspense fallback={<p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </PublicAuthLayout>
  );
}
