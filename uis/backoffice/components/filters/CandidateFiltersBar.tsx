"use client";

import { useEffect, useRef, useState } from "react";
import type { CandidateFilters, RecordStage, RecordStatus } from "@/types/domain";
import { STAGE_OPTIONS, STATUS_OPTIONS } from "@/lib/mappers";

interface CandidateFiltersBarProps {
  filters: CandidateFilters;
  onChange: (updates: Partial<CandidateFilters>) => void;
}

export function CandidateFiltersBar({ filters, onChange }: CandidateFiltersBarProps) {
  const [searchInput, setSearchInput] = useState<string>(filters.search ?? "");
  const onChangeRef = useRef(onChange);
  const committedSearchRef = useRef<string>(filters.search ?? "");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const externalSearch = filters.search ?? "";

    // Only sync from URL/filters when it represents an external navigation change
    // and not an in-progress local typing value.
    if (externalSearch !== committedSearchRef.current && externalSearch !== searchInput) {
      committedSearchRef.current = externalSearch;
      setSearchInput(externalSearch);
    }
  }, [filters.search, searchInput]);

  useEffect(() => {
    const debounceId = window.setTimeout(() => {
      if (searchInput !== committedSearchRef.current) {
        committedSearchRef.current = searchInput;
        onChangeRef.current({ search: searchInput || undefined, page: 1 });
      }
    }, 500);

    return () => window.clearTimeout(debounceId);
  }, [searchInput]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Candidate Filters</h2>
      <p className="mt-1 text-sm text-slate-600">Filter by status and stage, or search by name/email.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Search</span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by full name or email"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Status</span>
          <select
            value={filters.status ?? ""}
            onChange={(event) =>
              onChange({ status: (event.target.value || undefined) as RecordStatus | undefined, page: 1 })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Stage</span>
          <select
            value={filters.stage ?? ""}
            onChange={(event) =>
              onChange({ stage: (event.target.value || undefined) as RecordStage | undefined, page: 1 })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">All stages</option>
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
