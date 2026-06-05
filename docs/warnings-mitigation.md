# Warnings Mitigation Notes

This document tracks non-blocking warnings observed during local validation, what was already fixed, and what remains operational or dependency-driven.

## 1) Next.js Workspace Root Inference Warning

Status: mitigated in code.

Observed warning:

- Next.js inferred workspace root because multiple lockfiles were detected.

Mitigation applied:

- Added explicit `turbopack.root` in:
  - `uis/website/next.config.ts`
  - `uis/backoffice/next.config.ts`

Validation:

- Website production build passes.
- Backoffice production build passes.
- Root-inference warning no longer appears in build output after config update.

## 2) Slow Filesystem Warning

Status: operational warning (environment-dependent), not a code defect.

Observed warning:

- Next.js reported slow filesystem benchmark during `next dev`.

Recommended mitigations:

1. Keep the repository on a local SSD path (avoid network/mapped/cloud-synced folders for active development).
2. Exclude `.next` directories from antivirus real-time scanning.
3. Close heavy background indexing tools while running local dev servers.

Verification approach:

- Re-run `npm run dev` in each UI and compare warning frequency and startup time.

## 3) npm Audit Moderate Advisory (Next.js Transitive PostCSS)

Status: pending dependency-side fix; currently no safe non-breaking auto-fix path from `npm audit`.

Observed warning:

- Moderate advisory tied to Next.js transitive dependency chain (PostCSS advisory).

Current decision:

- Defer forced upgrade paths that introduce breaking changes.
- Monitor for patched Next.js release and re-run audit after dependency updates.

Follow-up trigger:

1. Any new Next.js patch/minor release available.
2. Security policy change requiring immediate remediation.

Recheck commands:

1. `npm --prefix uis/backoffice audit`
2. `npm --prefix uis/website audit`
3. `npm --prefix uis/backoffice run build`
4. `npm --prefix uis/website run build`
