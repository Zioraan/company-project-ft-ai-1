"use client";

import { FormEvent, useEffect, useState } from "react";

import { PlatformApiError } from "@/lib/platform-api-client";
import { getCurrentUser, updateProfile } from "@/services/auth";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

export function ProfileForm() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const user = await getCurrentUser();
        if (!active) {
          return;
        }
        setUserId(user.id);
        setName(user.name);
        setEmail(user.email);
      } catch (loadError) {
        if (!active) {
          return;
        }
        const message =
          loadError instanceof PlatformApiError
            ? loadError.message
            : "Unable to load profile.";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

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
    return <p className="text-sm text-slate-600 dark:text-slate-400">Loading profile...</p>;
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Name</span>
        <input
          className={inputClassName}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Email</span>
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
