"""Incident analysis API routes."""

from __future__ import annotations

import io

from domain.incident_analysis import (
    RULE_DISPLAY_ORDER,
    RULE_LABELS,
    AnalysisResult,
    CsvParseError,
    EmptyFileError,
    MissingHeaderError,
    NoDataRowsError,
    analyze_incidents,
    load_incidents_from_binary,
    load_incidents_from_text,
    results_csv_text,
)
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.schemas.incidents import (
    AnalysisResponseSchema,
    BreakdownItemSchema,
    ErrorResponseSchema,
    SatisfactionSchema,
    TotalsSchema,
)
from app.store.analysis_store import get_last_analysis, save_analysis

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def _to_response(result: AnalysisResult) -> AnalysisResponseSchema:
    return AnalysisResponseSchema(
        source_name=result.source_name,
        totals=TotalsSchema(
            total_records=result.total_records,
            valid_count=result.valid_count,
            invalid_count=result.invalid_count,
        ),
        invalid_breakdown=[
            BreakdownItemSchema(
                label=RULE_LABELS[rule_id],
                count=result.invalid_breakdown[rule_id],
            )
            for rule_id in RULE_DISPLAY_ORDER
            if result.invalid_breakdown.get(rule_id, 0) > 0
        ],
        by_category=[
            BreakdownItemSchema(
                label=item.category,
                count=item.count,
                percentage=item.percentage,
            )
            for item in result.by_category
        ],
        by_status=[
            BreakdownItemSchema(
                label=item.status,
                count=item.count,
                percentage=item.percentage,
            )
            for item in result.by_status
        ],
        satisfaction=SatisfactionSchema(
            scored_tickets=result.satisfaction.scored_tickets,
            closed_tickets=result.satisfaction.closed_tickets,
            average=result.satisfaction.average,
            distribution=result.satisfaction.distribution,
        ),
    )


def _validate_upload(file: UploadFile) -> None:
    filename = (file.filename or "").lower()
    if not filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be a CSV with a .csv extension.",
        )


@router.post(
    "/analyze",
    response_model=AnalysisResponseSchema,
    responses={
        400: {"model": ErrorResponseSchema},
        422: {"model": ErrorResponseSchema},
    },
)
async def analyze_incident_file(file: UploadFile = File(...)) -> AnalysisResponseSchema:
    _validate_upload(file)

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    try:
        source_name, rows = load_incidents_from_binary(
            io.BytesIO(raw),
            source_name=file.filename or "uploaded.csv",
        )
    except EmptyFileError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MissingHeaderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except NoDataRowsError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except CsvParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    result = analyze_incidents(rows, source_name=source_name)
    save_analysis(result)
    return _to_response(result)


@router.get("/results/export")
async def export_results() -> Response:
    result = get_last_analysis()
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No analysis results are available to export.",
        )

    return Response(
        content=results_csv_text(result),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="results.csv"'
        },
    )
