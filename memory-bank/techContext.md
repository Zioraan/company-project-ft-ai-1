# Technical Context

## Current Stack

- TypeScript at root for logic layer and tests.
- Vitest for unit testing root business logic.
- Next.js (App Router), React, Tailwind in talent pipeline tracker app.
- SWR in `uis/backoffice` for client-side cache/dedup and hydration-aware data fetching.

## Existing Architecture Patterns Worth Preserving

- Service boundary for API operations.
- Shared API client with normalized error handling.
- Mapper boundary for API enum to UI label translation.
- Query-state sync with URL params in list/filter UX.

## Known Constraints

1. `CONTEXT.md` is mandatory business context for all sessions.
2. Historical milestone contexts are reference-only unless explicitly requested.
3. Coding governance lives in root `AGENTS.md` and `.agents/*`.
4. Runtime company agents are separated under `agents/`.

## Planned Structural Direction

- Target product structure includes `uis/website` and `uis/backoffice`.
- Root `services` will host shared business/API integration contracts.
- Migration should be staged with parity checkpoints, not a one-shot rewrite.

## Current Migration Snapshot

- Stage 2 cutover policy is documented; legacy `apps/*` paths are deprecated for net-new work.
- Stage 3 service extraction has started with shared root adapters for records and notes.
- Backoffice hooks (`useCandidates`, `useCandidateDetail`, `useNotes`) are now SWR-backed with server-prefetch fallback data support.
- Stage 4 sunset criteria are explicitly documented to govern eventual legacy path removal/freeze.

## Engineering Rule Anchors

- Never render raw API status/stage enums in UI.
- No direct fetch calls in UI components.
- Always expose async loading and failure states.
- Keep shared contracts centralized to avoid drift across surfaces.

## Verification Baseline

- Lint, typecheck, and tests are required before commit.
- Governance and memory updates are required when architecture/workflow changes.

## Tooling Notes

- `next dev` can auto-update app-level `tsconfig.json` settings (for example `jsx` and dev type includes). Treat these changes as explicit review items.
- Next.js warns about multiple lockfiles in this monorepo layout; warnings are non-blocking but should be tracked for noise reduction.

## Update Trigger

Update this file whenever stack decisions, architecture boundaries, or hard constraints change.
