# Backoffice UI (Target Surface)

Purpose:

Internal operations interface for hiring and workflow management, evolving from the existing talent tracker implementation.

Current status:

Stage 2 implementation in closure phase. Current migrated pieces:

1. Next.js tracker app layers copied from source to target structure.
2. Existing data/list/detail/filter/notes UI and hooks migrated into target path.
3. Service, mapper, query, and API client layers migrated with current behavior.

Remaining for full Stage 2 parity:

1. Stage 3 handoff preparation for shared service extraction.

Stage 2 closure references:

1. `docs/migration-checkpoints.md`
2. `docs/eval-traceability.md`
3. `docs/stage2-cutover-checklist.md`

Staged migration checkpoints:

1. Data parity checkpoint: list/detail/filter/search parity.
2. Process parity checkpoint: status/stage updates and notes operations parity.
3. UX parity checkpoint: loading, success, and error states parity.
4. Rule parity checkpoint: no raw API enums in UI and no direct fetch in components.
5. Regression checkpoint: no loss of existing tested root logic integrations.
