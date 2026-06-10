"use client";

import { useRef, useState } from "react";

type IncidentUploadProps = {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
};

export function IncidentUpload({
  disabled = false,
  onFileSelected,
}: IncidentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file || disabled) {
      return;
    }

    onFileSelected(file);
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
        isDragging
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
          : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFile(event.dataTransfer.files?.[0]);
      }}
      onClick={() => {
        if (!disabled) {
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <p className="text-base font-medium text-slate-900 dark:text-slate-100">
        Drop a CSV file here or click to browse
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Support ticket exports only. Customer emails are never displayed.
      </p>
    </div>
  );
}
