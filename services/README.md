# services Directory

This directory hosts shared service contracts and integration boundaries used by multiple UI surfaces.

Purpose:

1. Centralize business-facing service APIs.
2. Prevent duplicated remote access logic across `uis/website` and `uis/backoffice`.
3. Preserve consistent error handling and contract evolution.

Service architecture guidelines:

1. No UI rendering logic in this directory.
2. Contracts should be reusable and typed.
3. Keep adapters thin and testable.
4. Changes must be traceable in memory-bank/progress updates.

Planned structure:

- `services/api` for external API adapters.
- `services/domain` for business-oriented service façades.
- `services/contracts` for shared request/response types.

Current extracted modules:

- `services/contracts/records.ts`
- `services/domain/records.ts`
- `services/contracts/notes.ts`
- `services/domain/notes.ts`

Stage 3 extraction status:

1. Records service contract and domain factory extracted.
2. Notes service contract and domain factory extracted.
3. Backoffice records and notes adapters now consume shared root domain factories.
4. Additional services should migrate incrementally with parity validation per step.

Migration note:

Current service logic exists inside `apps/talent-pipeline-tracker/services`. Move incrementally and validate parity before switching consumers.
