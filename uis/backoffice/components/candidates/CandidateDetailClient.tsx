"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CandidateForm } from "@/components/forms/CandidateForm";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { useCandidateDetail } from "@/hooks/useCandidateDetail";
import { useNotes } from "@/hooks/useNotes";
import {
  mapStageLabel,
  mapStatusLabel,
  STAGE_OPTIONS,
  STATUS_OPTIONS,
} from "@/lib/mappers";
import type { ApiNote, ApiRecord } from "@/types/api";
import type {
  CandidateFormValues,
  RecordStage,
  RecordStatus,
} from "@/types/domain";

interface CandidateDetailClientProps {
  candidateId: string;
  initialRecord: ApiRecord;
  initialNotes: ApiNote[];
}

export function CandidateDetailClient({
  candidateId,
  initialRecord,
  initialNotes,
}: CandidateDetailClientProps) {
  const router = useRouter();

  const {
    record,
    loading,
    saving,
    error,
    saveFullRecord,
    saveStatusAndStage,
    removeRecord,
  } = useCandidateDetail(candidateId, { initialRecord });
  const {
    notes,
    loading: notesLoading,
    saving: notesSaving,
    error: notesError,
    addNote,
    removeNote,
  } = useNotes(candidateId, { initialNotes });

  const [status, setStatus] = useState<RecordStatus | "">("");
  const [stage, setStage] = useState<RecordStage | "">("");
  const [statusStageMessage, setStatusStageMessage] = useState<string | null>(
    null,
  );

  if (loading) {
    return (
      <main className="p-6 text-slate-700">Loading candidate detail...</main>
    );
  }

  if (error || !record) {
    return (
      <main className="p-6">
        <p className="text-red-700">{error ?? "Candidate not found"}</p>
        <Link
          href="/"
          className="mt-3 inline-block rounded bg-slate-900 px-3 py-2 text-sm text-white"
        >
          Back to list
        </Link>
      </main>
    );
  }

  const editInitialValues: CandidateFormValues = {
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    position: record.position,
    linkedin_url: record.linkedin_url ?? "",
    cv_url: record.cv_url,
    experience_years: record.experience_years,
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            Back to candidates
          </Link>
          <button
            disabled={saving}
            onClick={async () => {
              await removeRecord();
              router.push("/");
            }}
            className="rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Deleting..." : "Delete candidate"}
          </button>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {record.full_name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{record.position}</p>

          <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p>
              <span className="font-semibold">Email:</span> {record.email}
            </p>
            <p>
              <span className="font-semibold">Phone:</span> {record.phone}
            </p>
            <p>
              <span className="font-semibold">LinkedIn:</span>{" "}
              {record.linkedin_url ?? "N/A"}
            </p>
            <p>
              <span className="font-semibold">CV URL:</span> {record.cv_url}
            </p>
            <p>
              <span className="font-semibold">Years of experience:</span>{" "}
              {record.experience_years}
            </p>
            <p>
              <span className="font-semibold">Applied at:</span>{" "}
              {new Date(record.applied_at).toLocaleString()}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {mapStatusLabel(record.status)}
            </p>
            <p>
              <span className="font-semibold">Stage:</span>{" "}
              {mapStageLabel(record.stage)}
            </p>
          </div>

          <div className="mt-4 grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as RecordStatus)
              }
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Update status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={stage}
              onChange={(event) => setStage(event.target.value as RecordStage)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Update stage</option>
              {STAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              disabled={saving || !status || !stage}
              onClick={async () => {
                await saveStatusAndStage(
                  status as RecordStatus,
                  stage as RecordStage,
                );
                setStatus("");
                setStage("");
                setStatusStageMessage("Status and stage updated successfully.");
              }}
              className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Updating..." : "Apply changes"}
            </button>
          </div>

          {statusStageMessage && (
            <p className="mt-2 text-sm text-emerald-700">
              {statusStageMessage}
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </section>

        <CandidateForm
          title="Edit Candidate Data"
          initialValues={editInitialValues}
          submitLabel="Save candidate"
          onSubmit={async (values) => {
            await saveFullRecord(values);
          }}
        />

        <NotesPanel
          notes={notes}
          loading={notesLoading}
          saving={notesSaving}
          error={notesError}
          onAdd={addNote}
          onDelete={removeNote}
        />
      </div>
    </main>
  );
}
