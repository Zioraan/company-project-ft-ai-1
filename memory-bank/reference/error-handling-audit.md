# Error Handling Audit — Reference for Next Stage

**Audit date:** 2025-06-25  
**Scope:** `/uis/backoffice`, `/uis/website`, `/services/api`, `/services/contracts`, `/services/domain`, `/packages/shared`, `/src`, `/scripts`, `/tests`  
**Excluded:** `/apps/**` (legacy — scheduled for deletion)

**Remediation status:** 36 of 37 resolved (2025-06-25). Deferred: `pandas_clean.py` (snippet only).

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 5 |
| HIGH     | 14 |
| MEDIUM   | 12 |
| LOW      | 6 |
| **Total**| **37** |

---

## CRITICAL

- [x] **`services/api/app/core/email.py` (20–26)** — **SENSITIVE DATA LEAKS** — Dev fallback prints and logs user email and full password-reset URL (includes JWT token) to stdout/logs. — Log only that a reset was triggered; never log tokens or reset URLs; gate dev output behind an explicit debug flag.

- [x] **`uis/backoffice/app/(protected)/candidates/page.tsx` (5)** — **MISSING TRY/CATCH** — Server component calls `getRecords()` with no error handling; failure crashes the route. — Wrap in try/catch and render a recoverable error UI, or add an `error.tsx` boundary with a safe message.

- [x] **`services/api/app/main.py` (33–54)** — **RAW ERROR EXPOSURE** — No global exception handler; unhandled exceptions return FastAPI default 500 (stack/details in debug). — Add a global handler that returns a stable JSON error shape and logs details server-side only.

- [x] **`services/api/app/core/email.py` (29–43)** — **MISSING TRY/CATCH** — `resend.Emails.send()` has no error handling; provider failures become unhandled 500s. — Catch provider errors, log internally, return a generic 503/500 without provider internals.

- [x] **`uis/backoffice/app/(protected)/suppliers/page.tsx` (8–12)** — **SILENT FAILURES** — Bare `catch` swallows all SSR `getSuppliers()` failures with no logging or user signal. — Log the error; pass an error flag to the client or surface SSR failure in the UI.

---

## HIGH

- [x] **`uis/backoffice/lib/platform-api-client.ts` (130–143, 168–181)** — **MISSING TRY/CATCH** — `fetch`, `response.json()`, and `response.blob()` can throw (network/parse); errors bubble as unhandled rejections. — Wrap I/O in try/catch and throw typed `PlatformApiError` with safe, user-facing messages.

- [x] **`uis/backoffice/lib/api-client.ts` (16–41)** — **MISSING TRY/CATCH** — Unguarded `fetch` / `response.json()` for external talent API. — Centralize network/parse failure handling in the client boundary.

- [x] **`services/api/app/routers/auth.py` (51–54)** — **RAW ERROR EXPOSURE / SENSITIVE DATA LEAKS** — `DuplicateEmailError` message (`User with email … already exists`) returned verbatim; enables account enumeration. — Return generic conflict message (e.g. “Registration could not be completed”).

- [x] **`services/api/app/routers/users.py` (26–28, 65–67)** — **RAW ERROR EXPOSURE / SENSITIVE DATA LEAKS** — Same duplicate-email message exposure on create/update. — Use generic conflict responses; map internally only.

- [x] **`services/api/app/store/users_store.py` (62, 115)** — **SENSITIVE DATA LEAKS** — Exception messages embed user emails at source. — Use internal codes/messages without PII in exception text.

- [x] **`scripts/analyze.py` (52–57)** — **MISSING sys.exit ON SCRIPT FAILURE** — `export_results_csv()` failures are uncaught; script still exits 0. — Wrap export in try/except and `return 1` on failure.

- [x] **`scripts/analyze.py` (38–40)** — **OVERLY BROAD CATCH** — `except Exception` wraps all non-`FileNotFoundError` read failures. — Catch specific CSV/domain errors; reserve broad catch for top-level CLI only.

- [x] **`uis/backoffice/components/suppliers/SupplierDirectoryClient.tsx` (31–44, 74–77)** — **MISSING TRY/CATCH** — Rate/status/create handlers call `refetch()` without try/catch; post-success refetch failure surfaces as action failure. — Try/catch per operation; on refetch failure show stale-data warning + retry instead of failing the mutation.

- [x] **`uis/backoffice/components/candidates/CandidateDetailClient.tsx` (102–105, 181–188)** — **MISSING TRY/CATCH** — Async `onClick` handlers await mutations without local catch → unhandled rejections on failure. — Wrap in try/catch; show inline error and avoid navigation on failure.

- [x] **`uis/backoffice` (app root / route segments)** — **RAW ERROR EXPOSURE** — No `error.tsx` or `global-error.tsx`; unhandled errors use Next.js default (verbose in dev). — Add route-level error boundaries with sanitized messages.

- [x] **`uis/backoffice/lib/platform-api-client.ts` (50–89)** — **RAW ERROR EXPOSURE** — Forwards API `detail` / validation messages directly to UI (including status text). — Whitelist/map known error codes; fallback to generic copy for unknown/server errors.

- [x] **`uis/backoffice/lib/api-client.ts` (44–50)** — **RAW ERROR EXPOSURE** — Forwards third-party API `error` field verbatim to UI. — Sanitize external messages before display.

- [x] **`uis/backoffice/components/suppliers/SupplierDetailClient.tsx` (31–38)** — **NO USER CALL TO ACTION** — Error/not-found state is text-only with no retry or navigation. — Add “Back to directory” and “Try again” (`refetch`).

- [x] **`uis/backoffice/components/auth/ProfileForm.tsx` (82–128)** — **MISSING LOADING/ERROR UI STATES** — After load failure, renders empty editable form (no `userId`) instead of a dedicated error state. — On load error, show error panel with retry; hide form until loaded.

---

## MEDIUM

- [x] **`uis/backoffice/components/forms/CandidateForm.tsx` (32–33)** — **SILENT FAILURES** — Bare `catch` discards error details; always shows generic message. — Catch `ApiError` and surface `message`; log unknown errors.

- [x] **`uis/backoffice/components/candidates/CandidateListClient.tsx` (79–83)** — **NO USER CALL TO ACTION** — List fetch error shown with no retry (`refetch` exists but unused). — Add “Retry” button wired to `refetch`.

- [x] **`uis/backoffice/components/suppliers/SupplierDirectoryClient.tsx` (97–101)** — **NO USER CALL TO ACTION** — Supplier list error has no retry/navigation. — Add retry via `refetch` and link back to dashboard.

- [x] **`uis/backoffice/components/incidents/IncidentAnalysisClient.tsx` (89–96, 117–124)** — **NO USER CALL TO ACTION** — Upload/export errors lack explicit retry actions. — Add “Try again” / “Re-upload” and “Retry export” buttons.

- [x] **`uis/backoffice/components/notes/NotesPanel.tsx` (18–26)** — **MISSING TRY/CATCH** — `onAdd` awaited without catch; failures rely on hook rethrow. — Catch in submit handler and show inline feedback without unhandled rejection.

- [x] **`services/api/app/routers/incidents.py` (110–117)** — **RAW ERROR EXPOSURE** — `detail=str(exc)` forwards domain exception text (paths/column names) to API clients. — Map to stable error codes/messages; avoid file paths in responses.

- [x] **`scripts/analyze.py` (36, 39)** — **RAW ERROR EXPOSURE** — Prints exception text to stderr (may include paths). — Map to user-safe CLI messages.

- [x] **`services/api/app/core/config.py` (37–38, 42–44)** — **MISSING TRY/CATCH** — `int()` on env vars can raise `ValueError` and crash startup. — Validate env with clear startup error or safe defaults.

- [x] **`services/api/app/main.py` (27–29)** — **MISSING TRY/CATCH** — Lifespan startup (`get_settings`, `seed_suppliers`) unguarded; failures prevent boot without clear handling. — Wrap startup; fail fast with actionable log message.

- [x] **`uis/backoffice/components/suppliers/SupplierDirectoryClient.tsx` (54–55)** — **RAW ERROR EXPOSURE** — Uses `err instanceof Error ? err.message` — may expose raw fetch/network messages. — Normalize to `SuppliersApiError` or generic copy.

- [x] **`uis/backoffice/hooks/useCandidates.ts` (30–35)** — **RAW ERROR EXPOSURE** — `ApiError.message` may still be raw upstream text from external API. — Sanitize at API client boundary.

- [x] **`uis/backoffice/lib/platform-api-client.ts` (89)** — **RAW ERROR EXPOSURE** — Fallback includes HTTP status code in user-visible message (`Request failed with status …`). — Use generic “Something went wrong” for unknown failures.

---

## LOW

- [ ] **`skills/data-analysis/scripts/pandas_clean.py` (8–30)** — **MISSING TRY/CATCH / MISSING sys.exit ON SCRIPT FAILURE** — `read_csv` and transforms unguarded; script exits 0 on failure. — Add try/except and `sys.exit(1)` on critical errors if promoted beyond snippet.

- [x] **`uis/backoffice/lib/platform-api-client.ts` (92–96)** — **MISSING TRY/CATCH (latent)** — `setUnauthorizedHandler` exported but never registered in app layout. — Wire handler in root client provider or remove dead API.

- [x] **`uis/backoffice/components/auth/AuthGuard.tsx` (16–22)** — **MISSING LOADING/ERROR UI STATES** — Indefinite “Loading…” if redirect fails or router stalls. — Add timeout/fallback with manual link to login.

- [x] **`uis/backoffice/components/auth/LoginForm.tsx` (65–68)** — **NO USER CALL TO ACTION** — Error shown but no explicit retry guidance (user must resubmit). — Optional retry hint or auto-focus email field.

- [x] **`uis/backoffice/components/auth/ChangePasswordForm.tsx` (87–90)** — **NO USER CALL TO ACTION** — Error with no recovery guidance beyond resubmit. — Add guidance for wrong current password / session expiry.

- [x] **`services/api/domain/incident_analysis.py` (217–220)** — **OVERLY BROAD CATCH (dead path)** — `UnicodeDecodeError` caught around `StringIO` read (won’t occur there). — Move decode error handling only to binary decode path.

---

## Out of Scope / No Action Required

These areas were reviewed and did not surface actionable error-handling gaps within audit scope:

- **`uis/website/**`** — Static marketing site; no async I/O or API calls.
- **`src/utils/**`, `services/contracts/**`, `services/domain/records.ts`** — Pure logic / thin delegation; errors propagate intentionally to callers.
- **`packages/shared/types/index.ts`** — Type placeholders only.
- **`tests/**`** — Test fixtures and assertions; not production error paths.
- **`/apps/**`** — Legacy; excluded from this reference per project direction.

---

## Areas With Generally Sound Patterns (baseline to preserve)

- Auth flows (`LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`): try/catch, loading states, recovery links on reset flows.
- SWR-based hooks (`useCandidates`, `useSuppliers`, `useCandidateDetail`, `useSupplierDetail`, `useNotes`): expose `loading`, `error`, and `refetch`.
- Incident analysis UI (`IncidentAnalysisClient`): explicit idle/loading/success/error states for upload.
- Server detail pages (`candidates/[id]/page.tsx`, `suppliers/[id]/page.tsx`): 404 mapping via `notFound()`; non-404 errors rethrown (needs `error.tsx`).
- FastAPI routers (`auth`, `suppliers`, `users`): deliberate `HTTPException` for expected failures.
- CLI `scripts/analyze.py`: usage validation and non-zero exit on CSV read failures (export path still open — see HIGH).

---

## Recommended Remediation Order

1. Stop logging password-reset tokens in `email.py` (CRITICAL security).
2. Add global API + Next.js error boundaries to prevent raw stack/status leakage.
3. Harden API clients (`platform-api-client`, `api-client`) against network/JSON failures.
4. Remove silent SSR catch on suppliers page; add proper server-side error handling on candidates page.
5. Add retry/navigation CTAs on list/detail error states where `refetch` already exists but is unused.
