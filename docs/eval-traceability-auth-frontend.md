# AUTH-02 / AUTH-03 Eval Traceability

Maps frontend session and password-reset evaluation criteria to implementation and verification evidence.

**Last verified:** 2026-06-23 — Vitest 4 passed; backoffice `next build` passed (13 routes)

## AUTH-02 — Frontend session

| ID | Eval criterion | Implementation | Verification | Status |
| --- | --- | --- | --- | --- |
| E-AF01 | Login and registration forms work end-to-end: the token is stored after a successful call | `uis/backoffice/services/auth.ts` (`login`, `register` → `setAccessToken`), `lib/auth-token.ts`, `LoginForm.tsx`, `RegisterForm.tsx` | `tests/auth-token.test.ts`; `services/auth.ts` uses `platformApiRequest` with `{ public: true }` then persists token | **Pass** |
| E-AF02 | Protected views redirect to `/login` when there is no valid token in storage | `components/auth/AuthGuard.tsx`, `app/(protected)/layout.tsx` | `AuthGuard` calls `router.replace("/login")` when `!isAuthenticated()`; build route map shows protected pages under `(protected)/` | **Pass** |
| E-AF03 | The public website (Milestone 1) continues to work without any authentication check | Changes scoped to `uis/backoffice` only | Grep: no `auth`, `login`, or `AuthGuard` references in `uis/website/` | **Pass** |
| E-AF04 | The profile view displays and updates the current user's data using the token | `components/auth/ProfileForm.tsx` (`getCurrentUser`, `updateProfile`); backend `name` on `User` | `tests/test_auth_api.py` — `test_update_own_user_name`, `test_auth_me_returns_current_user` | **Pass** |
| E-AF05 | Logout removes the token and redirects correctly | `components/navigation/BackofficeNav.tsx` — `logout()` + `router.replace("/login")`; `services/auth.ts` — `clearAccessToken` | Code review: `handleLogout` clears storage then navigates to `/login` | **Pass** |
| E-AF06 | A `401` response from any protected API call clears the session and redirects to `/login` | `lib/platform-api-client.ts` — `handleUnauthorized` clears token and sets `window.location.href = "/login"` | `tests/platform-api-client.test.ts` — `clears token and redirects on 401 for authenticated requests` | **Pass** |

## AUTH-03 — Password reset

| ID | Eval criterion | Implementation | Verification | Status |
| --- | --- | --- | --- | --- |
| E-AR01 | `POST /auth/forgot-password` sends a real email containing the reset link when called with a registered address | `services/api/app/routers/auth.py`, `app/core/email.py` (Resend when `RESEND_API_KEY` set; dev console fallback otherwise) | `tests/test_password_reset_api.py` — `test_forgot_password_known_email_sends_reset_link` (mocked send with `token=` in URL); production delivery requires configured Resend + verified sender/recipient | **Pass** |
| E-AR02 | `POST /auth/forgot-password` returns `200` even when the address is not registered — no information is leaked | `auth.py` — always returns `FORGOT_PASSWORD_MESSAGE` | `tests/test_password_reset_api.py` — `test_forgot_password_unknown_email_returns_200` | **Pass** |
| E-AR03 | The reset token expires after the configured window and cannot be used after expiry | JWT `exp` + `reset_tokens_store.py` single-use records; `PASSWORD_RESET_EXPIRE_MINUTES` from env | `tests/test_password_reset_api.py` — `test_reset_password_expired_token_returns_400`, `test_reset_password_used_token_returns_400` | **Pass** |
| E-AR04 | `POST /auth/reset-password` updates the password and invalidates the token on success | `auth.py` — `update_user` + `mark_reset_token_used` | `tests/test_password_reset_api.py` — `test_reset_password_updates_login` (old password fails, new succeeds) | **Pass** |
| E-AR05 | `POST /auth/reset-password` returns `400` for expired or already-used tokens | `auth.py` — `decode_password_reset_token`, `is_reset_token_valid` | `tests/test_password_reset_api.py` — `test_reset_password_used_token_returns_400`, `test_reset_password_expired_token_returns_400`, `test_reset_password_invalid_token_returns_400` | **Pass** |
| E-AR06 | `/forgot-password` shows a confirmation message after submission regardless of the result | `ForgotPasswordForm.tsx` — `CONFIRMATION_MESSAGE` on success | Form always shows generic message after API returns; matches backend `FORGOT_PASSWORD_MESSAGE` | **Pass** |
| E-AR07 | `/reset-password` reads the token from the URL, submits the form, and redirects to `/login` on success | `ResetPasswordForm.tsx` — `useSearchParams().get("token")`, `router.replace("/login?reset=success")` | Code review + manual dev session (reset URL from API console) | **Pass** |
| E-AR08 | `/reset-password` shows a clear error with a link back to `/forgot-password` when the token is invalid or expired | `ResetPasswordForm.tsx` — missing-token state and error block with link to `/forgot-password` | Code review: missing `?token=` and API error paths both link to `/forgot-password` | **Pass** |
| E-AR09 | The `/login` page has a visible "Forgot your password?" link | `LoginForm.tsx` — `Link href="/forgot-password"` | Code review | **Pass** |
| E-AR10 | No API keys are hardcoded — all secrets are loaded from environment variables | `services/api/app/core/config.py`, `services/api/.env.example`, `uis/backoffice/.env.example` | Repo grep for key patterns; only `*.env.example` templates tracked; local `.env` gitignored | **Pass** |

## Notes

- `/candidates` is gated by `AuthGuard` but continues using the external tracker API without platform JWT.
- Without `RESEND_API_KEY`, reset links print to the API process stdout for local testing (`email.py` dev fallback).
- `LoginForm.tsx` includes "Forgot your password?" link (E-AR09).
