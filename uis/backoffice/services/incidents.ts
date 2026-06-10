import { mapIncidentAnalysisResponse } from "@/lib/incident-mappers";
import {
  incidentsApiDownload,
  incidentsApiRequest,
} from "@/lib/incidents-api-client";
import type {
  IncidentAnalysisApiResponse,
  IncidentAnalysisResult,
} from "@/types/incidents";

export async function analyzeIncidents(
  file: File,
): Promise<IncidentAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await incidentsApiRequest<IncidentAnalysisApiResponse>(
    "/api/incidents/analyze",
    {
      method: "POST",
      body: formData,
    },
  );

  return mapIncidentAnalysisResponse(response);
}

export async function exportIncidentResults(): Promise<Blob> {
  return incidentsApiDownload("/api/incidents/results/export");
}
