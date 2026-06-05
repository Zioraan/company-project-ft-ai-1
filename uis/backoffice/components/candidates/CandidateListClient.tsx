"use client";

import { useMemo } from "react";
import { CandidateTable } from "@/components/candidates/CandidateTable";
import { CandidateFiltersBar } from "@/components/filters/CandidateFiltersBar";
import { CandidateForm } from "@/components/forms/CandidateForm";
import { useCandidates } from "@/hooks/useCandidates";
import { useQueryFilters } from "@/hooks/useQueryFilters";
import { createRecord } from "@/services/records";
import type { RecordsListResponse } from "@/types/api";
import type { CandidateFormValues } from "@/types/domain";

const EMPTY_FORM: CandidateFormValues = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: 0,
};

interface CandidateListClientProps {
  initialData?: RecordsListResponse;
}

export function CandidateListClient({ initialData }: CandidateListClientProps) {
  const { filters, setFilters } = useQueryFilters();
  const normalizedFilters = useMemo(
    () => ({
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
    }),
    [filters],
  );

  const { records, total, page, limit, loading, error, refetch } =
    useCandidates(normalizedFilters, { initialData });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="px-4 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-lg bg-slate-900 p-5 text-white">
          <h1 className="text-2xl font-bold">Backoffice: Talent Pipeline</h1>
          <p className="mt-1 text-sm text-slate-200">
            Executive Assistant process overview for People and Talent
            operations.
          </p>
        </header>

        <CandidateForm
          title="Register New Candidate"
          initialValues={EMPTY_FORM}
          submitLabel="Create candidate"
          onSubmit={async (values) => {
            await createRecord(values);
            await refetch();
          }}
        />

        <CandidateFiltersBar
          filters={normalizedFilters}
          onChange={(updates) =>
            setFilters({ ...normalizedFilters, ...updates })
          }
        />

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Candidates</h2>
            <span className="text-sm text-slate-600">
              Total records: {total}
            </span>
          </div>

          {loading && (
            <p className="text-sm text-slate-700">Loading candidates...</p>
          )}
          {error && <p className="text-sm text-red-700">{error}</p>}
          {!loading && !error && <CandidateTable records={records} />}

          <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFilters({
                    ...normalizedFilters,
                    page: Math.max(1, page - 1),
                  })
                }
                disabled={page <= 1}
                className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setFilters({
                    ...normalizedFilters,
                    page: Math.min(totalPages, page + 1),
                  })
                }
                disabled={page >= totalPages}
                className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
