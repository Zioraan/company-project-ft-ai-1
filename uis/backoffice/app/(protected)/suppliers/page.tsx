import { Suspense } from "react";
import { SupplierDirectoryClient } from "@/components/suppliers/SupplierDirectoryClient";
import { getSuppliers } from "@/services/suppliers";

export default async function SuppliersPage() {
  let initialData: Awaited<ReturnType<typeof getSuppliers>> | undefined;

  // JWT lives in browser localStorage, so SSR prefetch usually fails auth.
  // Leave initialData unset and let the client hook load with the session token.
  try {
    initialData = await getSuppliers();
  } catch {
    initialData = undefined;
  }

  return (
    <Suspense
      fallback={
        <section className="px-4 py-6 md:px-8">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Loading supplier directory...
          </p>
        </section>
      }
    >
      <SupplierDirectoryClient initialData={initialData} />
    </Suspense>
  );
}
