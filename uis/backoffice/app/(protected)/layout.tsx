import { AuthGuard } from "@/components/auth/AuthGuard";
import { UnauthorizedHandlerProvider } from "@/components/auth/UnauthorizedHandlerProvider";
import { BackofficeNav } from "@/components/navigation/BackofficeNav";

export default function ProtectedRoutesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UnauthorizedHandlerProvider>
      <AuthGuard>
        <BackofficeNav />
        {children}
      </AuthGuard>
    </UnauthorizedHandlerProvider>
  );
}
