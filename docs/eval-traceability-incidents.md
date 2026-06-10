# Incident Analysis Eval Traceability Matrix

Maps incident data-integrity milestone criteria to implementation artifacts and verification methods.

## Scope

- Phase 1 CLI analysis script
- Shared Python validation and metrics module
- Phase 2 FastAPI endpoints
- Backoffice incident analysis UI

## Matrix

| Criterion ID | Requirement Summary | Implementation File(s) | Verification Method | Status | Evidence Notes |
| --- | --- | --- | --- | --- | --- |
| E-I01 | CLI accepts CSV path argument | `scripts/analyze.py` | `python scripts/analyze.py tests/fixtures/incidents-synthetic.csv` | Pass | Argument parsing in `main()` |
| E-I02 | Loads CSV via pandas or stdlib | `services/api/domain/incident_analysis.py` | Unit test `test_analyze_synthetic_fixture_counts` | Pass | Uses stdlib `csv` module |
| E-I03 | Detects invalid records by rule | `validate_record`, `analyze_incidents` | Unit test `test_validate_record_detects_all_rules` | Pass | All 7 CONTEXT rules implemented |
| E-I04 | Excludes invalid from metrics | `analyze_incidents` | Unit test `test_invalid_records_excluded_from_category_metrics` | Pass | Valid rows filtered before aggregation |
| E-I05 | Reports valid/invalid totals | CLI + API response | `tests/test_nexova_golden.py` | Pass | Asserts 100 / 96 / 4 on `docs/incidents-nexova.csv` |
| E-I06 | Category breakdown on valid only | `analyze_incidents` | `tests/test_nexova_golden.py` | Pass | CONTEXT order and counts verified |
| E-I07 | Status breakdown on valid only | `analyze_incidents` | `tests/test_nexova_golden.py` | Pass | OPEN/CLOSED/DISCARDED counts verified |
| E-I08 | Avg satisfaction for closed scored | `analyze_incidents` | `tests/test_nexova_golden.py` | Pass | Average 3.84 and distribution verified |
| E-I09 | Formatted console summary | `format_console_report` | `tests/test_nexova_golden.py` | Pass | Dot-aligned branch lines and CONTEXT sections |
| E-I10 | Export prompt `[y / n]` | `scripts/analyze.py` | Manual CLI test | Pass | Interactive prompt after summary |
| E-I11 | `results.csv` one row per metric | `export_results_csv` | Unit test `test_results_csv_has_one_metric_per_row_and_no_emails` | Pass | `metric,value` rows only |
| E-I12 | Numeric values match CONTEXT exactly | Shared analysis module | `tests/test_nexova_golden.py` | Pass | Golden tests use `docs/incidents-nexova.csv` |
| E-I13 | No customer emails in outputs | All export/format paths | API + CSV tests grep for `@` | Pass | Emails never included in exports |
| E-I14 | `POST /api/incidents/analyze` multipart | `services/api/app/routers/incidents.py` | `tests/test_incidents_api.py` | Pass | Upload field `file` |
| E-I15 | Returns JSON summary | `AnalysisResponseSchema` | API analyze test | Pass | Totals, breakdowns, satisfaction |
| E-I16 | `GET /api/incidents/results/export` | `export_results` route | API export test | Pass | Returns `text/csv` attachment |
| E-I17 | HTTP errors for empty/wrong format | Router error handlers | API error tests | Pass | 400 for empty/non-CSV/missing header |
| E-I18 | Incident page in backoffice menu | `BackofficeNav`, `app/incidents/analysis/page.tsx` | Route/navigation review | Pass | Nav link to incident analysis |
| E-I19 | File upload UI | `IncidentUpload.tsx` | Component review | Pass | Drag-and-drop and file picker |
| E-I20 | Summary visible on screen | `IncidentAnalysisSummary.tsx` | UI review | Pass | Metrics rendered in page |
| E-I21 | Download CSV button | `IncidentAnalysisClient.tsx` | UI review | Pass | Calls export endpoint |
| E-I22 | Invalid record notification with counts | `IncidentAnalysisSummary.tsx` | UI review | Pass | Alert section with per-rule counts |
| E-I23 | Service boundary (no fetch in components) | `services/incidents.ts` | Lint/review | Pass | Components call service only |
| E-I24 | Loading/error async states | `IncidentAnalysisClient.tsx` | UI review | Pass | Loading, error, export states |

## Verification Commands

1. `pip install -r requirements-dev.txt`
2. `pytest`
3. `python scripts/analyze.py docs/incidents-nexova.csv`
4. `pytest tests/test_nexova_golden.py`
5. `npm run ci`
6. `npm run build --prefix uis/backoffice`

## Open Items

None for incident analysis milestone criteria E-I01 through E-I24.
