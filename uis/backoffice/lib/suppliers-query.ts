import type {
  SupplierCategory,
  SupplierCountry,
  SupplierFilters,
} from "@/types/suppliers";
import { SUPPLIER_CATEGORIES, SUPPLIER_COUNTRIES } from "@/types/suppliers";

function isSupplierCountry(value: string | null): value is SupplierCountry {
  return (
    value !== null &&
    (SUPPLIER_COUNTRIES as readonly string[]).includes(value)
  );
}

function isSupplierCategory(value: string | null): value is SupplierCategory {
  return (
    value !== null &&
    (SUPPLIER_CATEGORIES as readonly string[]).includes(value)
  );
}

export function buildSupplierQuery(filters: SupplierFilters): string {
  const query = new URLSearchParams();

  if (filters.country) {
    query.set("country", filters.country);
  }

  if (filters.category) {
    query.set("category", filters.category);
  }

  return query.toString();
}

export function parseSupplierFiltersFromSearchParams(
  params: URLSearchParams,
): SupplierFilters {
  const countryParam = params.get("country");
  const categoryParam = params.get("category");

  const filters: SupplierFilters = {};

  if (isSupplierCountry(countryParam)) {
    filters.country = countryParam;
  }

  if (isSupplierCategory(categoryParam)) {
    filters.category = categoryParam;
  }

  return filters;
}

export function serializeSupplierFiltersToSearchParams(
  filters: SupplierFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.country) {
    params.set("country", filters.country);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  return params;
}
