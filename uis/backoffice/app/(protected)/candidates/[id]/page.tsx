import { notFound } from "next/navigation";
import { CandidateDetailClient } from "@/components/candidates/CandidateDetailClient";
import { ApiError } from "@/lib/api-client";
import { getNotes } from "@/services/notes";
import { getRecordById } from "@/services/records";

interface CandidateDetailPageProps {
  params: { id: string };
}

export default async function CandidateDetailPage({
  params,
}: CandidateDetailPageProps) {
  const { id } = params;
  let record;
  let notesResponse;

  try {
    [record, notesResponse] = await Promise.all([
      getRecordById(id),
      getNotes(id),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <CandidateDetailClient
      candidateId={id}
      initialRecord={record}
      initialNotes={notesResponse.data}
    />
  );
}
