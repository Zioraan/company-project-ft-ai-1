# Talent sample seed data

Canonical Milestone 2 sample dataset for frontend demos and future database seeding.

## Source of truth

TypeScript definitions live in [`src/data/talent-sample-data.ts`](../../../src/data/talent-sample-data.ts). JSON files in this folder mirror the same records for ORM/SQL seed scripts.

## Files

- `candidates.json` — three sample candidates
- `vacancies.json` — active vacancy `V-2024-0892`
- `selection-processes.json` — three selection processes (includes one `Hired` row)

## Database usage

1. Load JSON rows into your seed tool.
2. Map rows to domain models with [`src/data/talent-sample-mappers.ts`](../../../src/data/talent-sample-mappers.ts).
3. Or use [`services/domain/talent-sample.ts`](../../../services/domain/talent-sample.ts) `createInMemoryTalentProvider()` until a DB adapter exists.

## Privacy

Records use fictional contact details suitable for development and evaluation only.
