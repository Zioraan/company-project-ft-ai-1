import { AuthGuard } from "@/components/auth/AuthGuard";
import { BackofficeNav } from "@/components/navigation/BackofficeNav";

export default function ProtectedRoutesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <BackofficeNav />
      {children}
    </AuthGuard>
  );
}
