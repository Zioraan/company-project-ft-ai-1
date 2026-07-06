# Error Handling Eval Traceability Matrix

Maps milestone error-handling criteria to implementation artifacts and verification methods.

## Scope

- FastAPI platform API (`services/api`)
- Backoffice UI (`uis/backoffice`)
- CLI `scripts/analyze.py`

Excluded: `apps/**` (legacy), `uis/website` (static), `skills/data-analysis/scripts/pandas_clean.py` (snippet — deferred).

## Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| E-EH01 | Three-state UI on async surfaces | `AsyncState.tsx`, list/detail/incident clients | Manual UI smoke + code review | Pass | Loading / fulfilled / rejected on candidates, suppliers, profile, incidents |
| E-EH02 | Human-readable errors + CTA | `ErrorState.tsx`, updated clients | Manual smoke | Pass | Retry + back navigation on error panels |
| E-EH03 | Scoped try/catch | `platform-api-client.ts`, `api-client.ts`, mutation handlers | Vitest + code review | Pass | Network/parse scoped in clients; handlers scoped to `await` |
| E-EH04 | `finally` loading cleanup | Hooks + auth forms | Code review | Pass | Existing hooks/forms retain `finally` blocks |
| E-EH05 | Optional chaining / fallbacks | `NotesPanel.tsx`, detail views | Code review | Pass | Safe `created_at` fallback; existing `??` on optional fields |
| E-EH06 | Structured backend JSON + status codes | `core/exceptions.py`, routers | pytest | Pass | 422 validation, generic 500, mapped incident errors |
| E-EH07 | No sensitive data in client errors | `email.py`, auth routers, API clients | pytest + grep | Pass | No token/email in dev logs; generic 409 messages |
| E-EH08 | Script I/O + exit codes | `scripts/analyze.py` | `tests/test_analyze_cli.py` | Pass | Missing file / bad extension → exit 1 |

## Verification Commands

1. `npm run ci`
2. `npm run build --prefix uis/backoffice`
3. `pytest`
4. Manual: forgot-password with no `RESEND_API_KEY` — confirm logs contain no email/token/URL

## Related Artifacts

- Audit checklist: `memory-bank/documentation/error-handling-audit.md`
- Implementation plan (completed): `memory-bank/past-implementations/error-handling-remediation.md`
