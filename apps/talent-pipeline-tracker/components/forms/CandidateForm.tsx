"use client";

import { useState } from "react";
import type { CandidateFormValues } from "@/types/domain";

interface CandidateFormProps {
  title: string;
  initialValues: CandidateFormValues;
  submitLabel: string;
  onSubmit: (values: CandidateFormValues) => Promise<void>;
}

export function CandidateForm({ title, initialValues, submitLabel, onSubmit }: CandidateFormProps) {
  const [form, setForm] = useState<CandidateFormValues>(initialValues);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField = <K extends keyof CandidateFormValues>(key: K, value: CandidateFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(form);
      setSuccess("Operation completed successfully.");
    } catch {
      setError("Request failed. Please review input values and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <label htmlFor="candidate-full-name" className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Full name</span>
          <input
            id="candidate-full-name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. Alex Morgan"
            value={form.full_name}
            onChange={(event) => updateField("full_name", event.target.value)}
          />
        </label>

        <label htmlFor="candidate-email" className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Email</span>
          <input
            id="candidate-email"
            required
            type="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. alex@example.com"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>

        <label htmlFor="candidate-phone" className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Phone</span>
          <input
            id="candidate-phone"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. +1 555 123 4567"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </label>

        <label htmlFor="candidate-position" className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Position</span>
          <input
            id="candidate-position"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. Executive Assistant"
            value={form.position}
            onChange={(event) => updateField("position", event.target.value)}
          />
        </label>

        <label htmlFor="candidate-linkedin" className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">LinkedIn URL</span>
          <input
            id="candidate-linkedin"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="https://linkedin.com/in/username"
            value={form.linkedin_url}
            onChange={(event) => updateField("linkedin_url", event.target.value)}
          />
        </label>

        <label htmlFor="candidate-cv-url" className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">CV URL</span>
          <input
            id="candidate-cv-url"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="https://example.com/cv.pdf"
            value={form.cv_url}
            onChange={(event) => updateField("cv_url", event.target.value)}
          />
        </label>

        <label htmlFor="candidate-experience-years" className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Years of experience (0-50)</span>
          <input
            id="candidate-experience-years"
            required
            type="number"
            min={0}
            max={50}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. 5"
            value={form.experience_years}
            onChange={(event) => updateField("experience_years", Number(event.target.value))}
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>

      {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
