"use client";

import { FormEvent, useState } from "react";

import { PlatformApiError } from "@/lib/platform-api-client";
import { changePassword } from "@/services/auth";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-400 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch (submitError) {
      const message =
        submitError instanceof PlatformApiError
          ? submitError.message
          : "Unable to change password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Current password</span>
        <input
          className={inputClassName}
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">New password</span>
        <input
          className={inputClassName}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Confirm new password</span>
        <input
          className={inputClassName}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>

      {error ? (
        <div className="space-y-2">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            If your current password is wrong or your session expired, sign in
            again and retry.
          </p>
        </div>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <button
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        type="submit"
        disabled={loading}
      >
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
