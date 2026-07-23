import { notFound } from "next/navigation";
import { SupplierDetailClient } from "@/components/suppliers/SupplierDetailClient";
import { SuppliersApiError } from "@/lib/suppliers-api-client";
import { getSupplierById } from "@/services/suppliers";

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

async function loadSupplier(id: string) {
  try {
    return await getSupplierById(id);
  } catch (error) {
    if (error instanceof SuppliersApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const { id } = await params;
  const supplier = await loadSupplier(id);

  return (
    <SupplierDetailClient supplierId={id} initialSupplier={supplier} />
  );
}
