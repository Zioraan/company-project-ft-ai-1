import { PublicAuthLayout } from "@/components/auth/PublicAuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <PublicAuthLayout
      title="Forgot password"
      subtitle="Enter your email and we will send a reset link if the account exists."
    >
      <ForgotPasswordForm />
    </PublicAuthLayout>
  );
}
