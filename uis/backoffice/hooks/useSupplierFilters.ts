"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseSupplierFiltersFromSearchParams } from "@/lib/suppliers-query";
import type { SupplierCategory, SupplierCountry, SupplierFilters } from "@/types/suppliers";

export function useSupplierFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    return parseSupplierFiltersFromSearchParams(
      new URLSearchParams(searchParams.toString()),
    );
  }, [searchParams]);

  const setFilters = (updates: Partial<SupplierFilters>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key: string, value?: string) => {
      if (value === undefined || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    };

    if ("country" in updates) {
      setOrDelete("country", updates.country as SupplierCountry | undefined);
    }

    if ("category" in updates) {
      setOrDelete("category", updates.category as SupplierCategory | undefined);
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  return {
    filters,
    setFilters,
  };
}
