# Progress

## Current State

- Root TypeScript logic layer and tests are implemented.
- Talent pipeline tracker Next.js app exists with service/hook/component separation.
- API mapping and query-filter patterns are in place.
- Governance bootstrap is in place.
- Platform FastAPI service (`services/api`) enforces stateless JWT authentication on supplier and incident routes.
- Backoffice (`uis/backoffice`) implements JWT session flows, route guards, account management, and password reset UI.

## Completed In This Iteration

1. Defined root coding governance contract (`AGENTS.md`).
2. Created required memory-bank core files:
   - `memory-bank/projectbrief.md`
   - `memory-bank/techContext.md`
   - `memory-bank/progress.md`
3. Created `.agents/rules` scoped rule files:
   - `.agents/rules/core-governance.md`
   - `.agents/rules/context-handling.md`
   - `.agents/rules/frontend-data-boundaries.md`
4. Created recurring skill definition:
   - `.agents/skills/eval-traceability/SKILL.md`
5. Archived prior milestone contexts in `memory-bank/reference` and added `memory-bank/reference/README.md` usage policy.
6. Removed legacy root milestone context files after archiving them under `memory-bank/reference`.
7. Created evaluation traceability matrix:
   - `docs/eval-traceability.md`
8. Scaffolded target architecture directories:
   - `uis/README.md`
   - `uis/website/README.md`
   - `uis/backoffice/README.md`
   - `services/README.md`
9. Added staged migration checkpoint plan:
   - `docs/migration-checkpoints.md`
10. Expanded governance policy with explicit rule hierarchy and additional engineering constraints in `AGENTS.md`.
11. Added canonical rule documentation and rule index:

- `.agents/rules/rule-catalog.md`
- `.agents/rules/README.md`

12. Added root cross-surface quality scripts in `package.json`:

- `lint`, `typecheck`, `test`, and `ci` orchestration.

13. Added CI workflow policy:

- `.github/workflows/ci.yml`

14. Started Stage 1 website migration implementation:

- `uis/website` Next.js scaffold (`package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`)
- landing page migration (`uis/website/app/page.tsx`)
- signup route and React validation form (`uis/website/app/signup/page.tsx`, `uis/website/components/TalentSignupForm.tsx`)

15. Expanded cross-surface quality gate to include `uis/website` lint/typecheck in root `package.json` and CI workflow.
16. Started Stage 2 backoffice migration implementation by copying tracker app layers into `uis/backoffice`.
17. Expanded cross-surface quality gate to include `uis/backoffice` lint/typecheck in root `package.json` and CI workflow.
18. Integrated Milestone 2 business logic into backoffice entry view via imports from original root modules and rendered computed outputs in UI.
19. Completed additional stage-eval traceability pass for `uis` structure, website/backoffice route requirements, and business-logic visibility criteria.
20. Completed Stage 2 parity audit fix pass on backoffice entry/layout composition and metadata consistency.
21. Completed Stage 2 cutover documentation and deprecation posture for legacy tracker path.
22. Started Stage 3 shared service extraction by introducing root records contracts/domain factory and switching backoffice records adapter to shared root service.
23. Continued Stage 3 extraction by introducing root notes contracts/domain factory and switching backoffice notes adapter to shared root service.
24. Updated `apps/*` documentation to legacy/reference-only policy and added explicit Stage 4 sunset criteria for eventual removal/freeze decisions.
25. Expanded eval traceability with Stage 3 and Stage 4 policy evidence (`E-21`, `E-22`, `E-23`).
26. Added repository PR template at `.github/pull_request_template.md` with explicit `MEM-001` memory-bank update checklist and governance validation prompts.
27. Implemented Phase 1 performance remediation: backoffice `/` and `/candidates/[id]` now use server-prefetched initial data with client hydration hooks to reduce first-load client waterfalls.
28. Implemented Phase 2 fixture decoupling: `BusinessLogicPanel` now uses production-safe backoffice demo data module instead of importing runtime data from `tests/fixtures`.
29. Implemented Phase 3 website font optimization baseline by adding `next/font` loading in `uis/website/app/layout.tsx`.
30. Implemented Phase 4 client data/cache hardening in backoffice by migrating candidate and notes hooks to SWR with fallback hydration and mutation-driven cache updates.
31. Implemented incident CSV data-integrity analysis Phase 1:
   - shared Python module at `services/api/domain/incident_analysis.py`
   - CLI entrypoint at `scripts/analyze.py`
   - synthetic fixture and pytest coverage in `tests/test_incident_analysis.py`
32. Implemented incident analysis Phase 2 platform integration:
   - FastAPI service at `services/api` with analyze and export endpoints
   - backoffice route at `uis/backoffice/app/incidents/analysis`
   - incidents service, mappers, and upload/summary UI components
33. Added incident eval traceability matrix at `docs/eval-traceability-incidents.md` and Python test job in CI.
34. Completed Milestone 4 backoffice alignment:
   - `/` restored as internal entry dashboard with `BackofficeDashboard` and enriched `BusinessLogicPanel`
   - Milestone 3 talent pipeline list moved to `/candidates`
   - Canonical M2 sample data at `src/data/talent-sample-data.ts` with DB mappers and `data/seed/talent` JSON mirrors
   - `services/domain/talent-sample.ts` in-memory provider stub for future DB swap
   - Cross-milestone validation doc at `memory-bank/documentation/milestone-4-validation.md`
   - Updated `docs/eval-traceability.md` evidence for E-16, E-17, E-18
35. Implemented Supplier Directory milestone (Milestone 09):
   - TinyDB-backed FastAPI supplier CRUD at `services/api/app/routers/suppliers.py` with idempotent seeding
   - Backoffice supplier directory at `/suppliers` and `/suppliers/[id]` with URL-synced filters
   - Service boundary, mappers, query parsers, and SWR hooks under `uis/backoffice/`
   - API tests at `tests/test_suppliers_api.py`; mapper/query tests at `tests/suppliers-*.test.ts`
   - Eval traceability at `docs/eval-traceability-suppliers.md`
36. Implemented AUTH-01 JWT authentication and route protection (`feature/auth`):
   - Core auth layer at `services/api/app/core/` (`config.py`, `security.py`, `dependencies.py`)
   - User CRUD store and routes at `services/api/app/store/users_store.py` and `app/routers/users.py` (`/users`)
   - Auth routes at `services/api/app/routers/auth.py` (`/auth/login`, `/auth/register`, `/auth/me`)
   - Stateless JWT via `python-jose` + `passlib[bcrypt]`; env-driven `JWT_SECRET_KEY` and `ACCESS_TOKEN_EXPIRE_MINUTES`
   - `get_current_user` dependency protects all `/api/suppliers/*` and `/api/incidents/*` routes; `/health` and public registration/login remain open
   - Self-only authorization for `PUT`/`DELETE /users/{id}` (`403` for cross-user mutation; admin RBAC deferred)
   - Shared pytest fixtures in `tests/conftest.py`; auth coverage in `tests/test_auth_api.py`
   - Regression suites updated for authenticated supplier/incident calls
   - Env template at `services/api/.env.example`; eval traceability at `docs/eval-traceability-auth.md`
37. Implemented AUTH-02 + AUTH-03 frontend auth and password reset:
   - Backoffice auth infra: `lib/auth-token.ts`, `lib/platform-api-client.ts`, `services/auth.ts`
   - Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password` under `app/(public)/`
   - Protected routes with `AuthGuard` under `app/(protected)/` including `/account/profile` and `/account/change-password`
   - Backend extensions: user `name`, `POST /auth/change-password`, forgot/reset password with Resend + TinyDB reset token tracking
   - Vitest coverage at `tests/auth-token.test.ts` and `tests/platform-api-client.test.ts`
   - Eval traceability at `docs/eval-traceability-auth-frontend.md`
38. Secrets and local-data hygiene pass (post AUTH-02/03):
   - Verified gitignore coverage: `services/api/.env`, `uis/backoffice/.env.local`, `services/api/data/` (TinyDB user hashes and reset tokens)
   - Only `*.env.example` templates are tracked; no API keys or credentials in committed source
   - Root `.gitignore` tightened with `!**/.env.example` and `*.pem`; local `.env` redacted of commented Resend key
   - Dev password reset: when `RESEND_API_KEY` is unset, reset URL prints to API console via `email.py` dev fallback
   - Production email requires Resend config; rotate any API key that was ever pasted into local `.env`

## Next Steps

1. Complete Stage 1 website parity checks (accessibility, visual parity, optional multilingual parity).
2. Continue Stage 3 migration for remaining service adapters and add adapter-level tests.
3. Execute Stage 4 cutover evidence checklist and confirm no operational dependency remains on legacy `apps/*` routes.
4. Decide whether to remediate or defer the current `npm audit` moderate vulnerabilities in `uis/backoffice` with explicit rationale.
5. ~~Verify `scripts/analyze.py` output against `docs/incidents-nexova.csv`~~ — completed via `tests/test_nexova_golden.py` (E-I12).

## Risks

- Governance drift if local rules conflict with baseline and are not resolved by strictest-wins policy.
- Migration risk if future structure changes happen without parity checkpoints.
- Runtime tooling risk: running `next dev` may auto-adjust local TypeScript config in app surfaces, creating incidental config diffs that should be reviewed before commit.
- Password reset email delivery requires `RESEND_API_KEY` in production; dev falls back to server log output.

## Update Trigger

Update this file after each meaningful implementation session, architecture change, or milestone checkpoint.
