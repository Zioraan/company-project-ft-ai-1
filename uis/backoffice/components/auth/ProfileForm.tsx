"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { PlatformApiError } from "@/lib/platform-api-client";
import { getCurrentUser, updateProfile } from "@/services/auth";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

export function ProfileForm() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setError(null);

    try {
      const user = await getCurrentUser();
      setUserId(user.id);
      setName(user.name);
      setEmail(user.email);
    } catch (loadErr) {
      const message =
        loadErr instanceof PlatformApiError
          ? loadErr.message
          : "Unable to load profile.";
      setLoadError(message);
      setUserId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProfile(userId, { name, email });
      setName(updated.name);
      setEmail(updated.email);
      setSuccess("Profile updated successfully.");
    } catch (submitError) {
      const message =
        submitError instanceof PlatformApiError
          ? submitError.message
          : "Unable to update profile.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Loading profile...
      </p>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        message={loadError}
        onRetry={() => void loadProfile()}
        backHref="/"
        backLabel="Back to dashboard"
      />
    );
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Name
        </span>
        <input
          className={inputClassName}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Email
        </span>
        <input
          className={inputClassName}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <button
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        type="submit"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
