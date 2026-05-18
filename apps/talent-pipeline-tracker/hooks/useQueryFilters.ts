"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseFiltersFromSearchParams } from "@/lib/query";
import type { CandidateFilters, RecordStage, RecordStatus } from "@/types/domain";

export function useQueryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    return parseFiltersFromSearchParams(new URLSearchParams(searchParams.toString()));
  }, [searchParams]);

  const setFilters = (updates: Partial<CandidateFilters>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key: string, value?: string | number) => {
      if (value === undefined || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    };

    setOrDelete("status", updates.status as RecordStatus | undefined);
    setOrDelete("stage", updates.stage as RecordStage | undefined);
    setOrDelete("search", updates.search);

    if (updates.page !== undefined) {
      setOrDelete("page", updates.page);
    }

    if (updates.limit !== undefined) {
      setOrDelete("limit", updates.limit);
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  return {
    filters,
    setFilters
  };
}
