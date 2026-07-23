import { PublicAuthLayout } from "@/components/auth/PublicAuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <PublicAuthLayout title="Sign in" subtitle="Access the Nexova backoffice.">
      {params.reset === "success" ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Password updated successfully. You can sign in with your new password.
        </p>
      ) : null}
      <LoginForm />
    </PublicAuthLayout>
  );
}
