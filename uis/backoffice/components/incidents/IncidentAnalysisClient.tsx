"use client";

import { useState } from "react";
import { IncidentAnalysisSummary } from "@/components/incidents/IncidentAnalysisSummary";
import { IncidentUpload } from "@/components/incidents/IncidentUpload";
import { ErrorState } from "@/components/ui/ErrorState";
import { IncidentsApiError } from "@/lib/incidents-api-client";
import {
  analyzeIncidents,
  exportIncidentResults,
} from "@/services/incidents";
import type { IncidentAnalysisResult } from "@/types/incidents";

type RequestState = "idle" | "loading" | "success" | "error";

export function IncidentAnalysisClient() {
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<IncidentAnalysisResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastUploadFile, setLastUploadFile] = useState<File | null>(null);

  async function handleFileSelected(file: File) {
    setLastUploadFile(file);
    setRequestState("loading");
    setErrorMessage(null);
    setExportError(null);

    try {
      const analysis = await analyzeIncidents(file);
      setResult(analysis);
      setRequestState("success");
    } catch (error) {
      setResult(null);
      setRequestState("error");
      setErrorMessage(
        error instanceof IncidentsApiError
          ? error.message
          : "Unable to analyze the uploaded file.",
      );
    }
  }

  async function handleExport() {
    setIsExporting(true);
    setExportError(null);

    try {
      const blob = await exportIncidentResults();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "results.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof IncidentsApiError
          ? error.message
          : "Unable to export analysis results.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Incident Analysis
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Upload a support ticket CSV to validate data integrity and review
          backlog metrics. Invalid records are reported by rule and excluded
          from the main analysis.
        </p>
      </header>

      <IncidentUpload
        disabled={requestState === "loading"}
        onFileSelected={handleFileSelected}
      />

      {requestState === "loading" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Analyzing uploaded file...
        </div>
      ) : null}

      {requestState === "error" && errorMessage ? (
        <ErrorState
          message={errorMessage}
          onRetry={
            lastUploadFile
              ? () => void handleFileSelected(lastUploadFile)
              : undefined
          }
          retryLabel="Try upload again"
        />
      ) : null}

      {requestState === "success" && result ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Source file:{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {result.sourceName}
              </span>
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              {isExporting ? "Preparing download..." : "Download results CSV"}
            </button>
          </div>

          {exportError ? (
            <ErrorState
              message={exportError}
              onRetry={() => void handleExport()}
              retryLabel="Retry export"
            />
          ) : null}

          <IncidentAnalysisSummary result={result} />
        </div>
      ) : null}
    </div>
  );
}
