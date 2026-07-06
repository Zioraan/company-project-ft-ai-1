import { Suspense } from "react";
import { SupplierDirectoryClient } from "@/components/suppliers/SupplierDirectoryClient";
import { getSuppliers } from "@/services/suppliers";

export default async function SuppliersPage() {
  let initialData;
  let initialError: string | undefined;

  try {
    initialData = await getSuppliers();
  } catch {
    initialError = "Unable to load suppliers. Please try again.";
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
      <SupplierDirectoryClient
        initialData={initialData}
        initialError={initialError}
      />
    </Suspense>
  );
}
