# Rule: Memory-Bank Update Discipline

- Rule ID: MEM-001
- Scope Type: always-active
- Applies To: entire repository
- Enforcement: blocking

## Rule

Implementation progress must keep memory-bank files current as part of normal delivery flow.

## Required Controls

1. Update `memory-bank/progress.md` when implementation status, migration stage, delivery scope, or next steps materially change.
2. Update `memory-bank/techContext.md` when architecture boundaries, stack/tooling behavior, or engineering constraints change.
3. Update `memory-bank/projectbrief.md` when business objective, delivery priorities, or scope definition changes.
4. Memory updates must be completed in the same session as the relevant implementation changes.
5. If a memory update is intentionally deferred, the reason and planned follow-up checkpoint must be recorded.

## Acceptance Criteria

- Progress memory reflects the latest implemented stage/milestone outcomes.
- Technical context reflects current architecture and tooling realities.
- Project brief remains aligned to active business and delivery priorities.
- Delivery summaries include explicit note when no memory update was required.
