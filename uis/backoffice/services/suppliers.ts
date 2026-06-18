import { buildSupplierQuery } from "@/lib/suppliers-query";
import { suppliersApiRequest } from "@/lib/suppliers-api-client";
import type {
  Supplier,
  SupplierCreateInput,
  SupplierFilters,
  SupplierRateUpdateInput,
  SupplierStatusUpdateInput,
} from "@/types/suppliers";

export async function getSuppliers(
  filters: SupplierFilters = {},
): Promise<Supplier[]> {
  const query = buildSupplierQuery(filters);
  const path = query ? `/api/suppliers?${query}` : "/api/suppliers";
  return suppliersApiRequest<Supplier[]>(path);
}

export async function getSupplierById(id: string): Promise<Supplier> {
  return suppliersApiRequest<Supplier>(`/api/suppliers/${id}`);
}

export async function createSupplier(
  input: SupplierCreateInput,
): Promise<Supplier> {
  return suppliersApiRequest<Supplier>("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSupplierRate(
  id: string,
  input: SupplierRateUpdateInput,
): Promise<Supplier> {
  return suppliersApiRequest<Supplier>(`/api/suppliers/${id}/rate`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateSupplierStatus(
  id: string,
  input: SupplierStatusUpdateInput,
): Promise<Supplier> {
  return suppliersApiRequest<Supplier>(`/api/suppliers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  await suppliersApiRequest<void>(`/api/suppliers/${id}`, {
    method: "DELETE",
  });
}
