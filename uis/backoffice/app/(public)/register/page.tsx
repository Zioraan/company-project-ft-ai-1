import { PublicAuthLayout } from "@/components/auth/PublicAuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <PublicAuthLayout
      title="Create account"
      subtitle="Register to access protected backoffice tools."
    >
      <RegisterForm />
    </PublicAuthLayout>
  );
}
