"""Incident CSV validation and metrics computation."""

from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import BinaryIO, TextIO

REQUIRED_COLUMNS = [
    "ticket_id",
    "date",
    "client_company",
    "category",
    "description",
    "agent_id",
    "status",
    "customer_email",
    "satisfaction_score",
]

VALID_CATEGORIES = frozenset(
    {"TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT"}
)
CATEGORY_ORDER = (
    "TECHNICAL",
    "BILLING",
    "ACCESS",
    "HR_QUERY",
    "COMPLAINT",
)
STATUS_ORDER = ("OPEN", "CLOSED", "DISCARDED")
RULE_DISPLAY_ORDER = (
    "missing_client_company",
    "invalid_category",
    "empty_description",
    "invalid_agent_id",
    "invalid_email",
    "closed_no_score",
    "score_out_of_range",
)
VALID_STATUSES = frozenset(STATUS_ORDER)
BRANCH_VALUE_COLUMN = 37
AGENT_ID_PATTERN = re.compile(r"^AGT-\d{2}$")

RULE_LABELS = {
    "missing_client_company": "Missing client_company",
    "invalid_category": "Invalid or missing category",
    "empty_description": "Empty description",
    "invalid_agent_id": "Invalid or missing agent_id",
    "invalid_email": "Invalid or missing email",
    "closed_no_score": "Closed ticket, no score",
    "score_out_of_range": "Satisfaction score out of range",
}

SATISFACTION_LABELS = {
    1: "Very dissatisfied",
    2: "Dissatisfied",
    3: "Neutral",
    4: "Satisfied",
    5: "Very satisfied",
}


class IncidentAnalysisError(Exception):
    """Base error for incident analysis failures."""


class EmptyFileError(IncidentAnalysisError):
    """Raised when the uploaded or provided file has no content."""


class MissingHeaderError(IncidentAnalysisError):
    """Raised when required CSV columns are absent."""


class NoDataRowsError(IncidentAnalysisError):
    """Raised when the CSV has a header but no data rows."""


class CsvParseError(IncidentAnalysisError):
    """Raised when CSV content cannot be parsed."""


@dataclass
class CategoryBreakdown:
    category: str
    count: int
    percentage: float


@dataclass
class StatusBreakdown:
    status: str
    count: int
    percentage: float


@dataclass
class SatisfactionBreakdown:
    scored_tickets: int
    closed_tickets: int
    average: float
    distribution: dict[int, int] = field(default_factory=dict)


@dataclass
class AnalysisResult:
    source_name: str
    total_records: int
    valid_count: int
    invalid_count: int
    invalid_breakdown: dict[str, int]
    by_category: list[CategoryBreakdown]
    by_status: list[StatusBreakdown]
    satisfaction: SatisfactionBreakdown


def _normalize_cell(value: str | None) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _parse_score(raw: str) -> int | None:
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def validate_record(row: dict[str, str]) -> list[str]:
    """Return rule IDs triggered for a single incident row."""
    rules: list[str] = []

    client_company = _normalize_cell(row.get("client_company"))
    category = _normalize_cell(row.get("category"))
    description = _normalize_cell(row.get("description"))
    agent_id = _normalize_cell(row.get("agent_id"))
    status = _normalize_cell(row.get("status"))
    customer_email = _normalize_cell(row.get("customer_email"))
    score_raw = _normalize_cell(row.get("satisfaction_score"))

    if not client_company:
        rules.append("missing_client_company")

    if not category or category not in VALID_CATEGORIES:
        rules.append("invalid_category")

    if not description or len(description) < 5:
        rules.append("empty_description")

    if not agent_id or not AGENT_ID_PATTERN.match(agent_id):
        rules.append("invalid_agent_id")

    if not customer_email or "@" not in customer_email:
        rules.append("invalid_email")

    if status == "CLOSED":
        score = _parse_score(score_raw)
        if score is None:
            rules.append("closed_no_score")
        elif score < 1 or score > 5:
            rules.append("score_out_of_range")
    elif score_raw:
        score = _parse_score(score_raw)
        if score is None or score < 1 or score > 5:
            rules.append("score_out_of_range")

    return rules


def _read_csv_rows(source: TextIO) -> list[dict[str, str]]:
    try:
        reader = csv.DictReader(source)
    except csv.Error as exc:
        raise CsvParseError("Unable to parse CSV content.") from exc

    if reader.fieldnames is None:
        raise MissingHeaderError("CSV file is missing a header row.")

    normalized_headers = [_normalize_cell(name) for name in reader.fieldnames]
    missing_columns = [
        column for column in REQUIRED_COLUMNS if column not in normalized_headers
    ]
    if missing_columns:
        raise MissingHeaderError(
            f"CSV is missing required columns: {', '.join(missing_columns)}"
        )

    rows: list[dict[str, str]] = []
    for raw_row in reader:
        row = {
            _normalize_cell(key): _normalize_cell(value)
            for key, value in raw_row.items()
            if key is not None
        }
        rows.append(row)

    if not rows:
        raise NoDataRowsError("CSV file contains no data rows.")

    return rows


def load_incidents_from_text(
    content: str, source_name: str = "uploaded.csv"
) -> tuple[str, list[dict[str, str]]]:
    """Load incidents from UTF-8 CSV text."""
    if not content or not content.strip():
        raise EmptyFileError("CSV file is empty.")

    try:
        rows = _read_csv_rows(io.StringIO(content))
    except UnicodeDecodeError as exc:
        raise CsvParseError("CSV file must be UTF-8 encoded.") from exc

    return source_name, rows


def load_incidents(path: str | Path) -> tuple[str, list[dict[str, str]]]:
    """Load incidents from a CSV file path."""
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    content = file_path.read_text(encoding="utf-8")
    return load_incidents_from_text(content, source_name=file_path.name)


def load_incidents_from_binary(
    file_obj: BinaryIO, source_name: str = "uploaded.csv"
) -> tuple[str, list[dict[str, str]]]:
    """Load incidents from a binary file-like object."""
    raw = file_obj.read()
    if not raw:
        raise EmptyFileError("CSV file is empty.")

    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise CsvParseError("CSV file must be UTF-8 encoded.") from exc

    return load_incidents_from_text(content, source_name=source_name)


def _percentage(count: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round((count / total) * 100, 1)


def analyze_incidents(
    rows: list[dict[str, str]], source_name: str = "incidents.csv"
) -> AnalysisResult:
    """Validate rows and compute metrics on valid records only."""
    invalid_breakdown = {rule_id: 0 for rule_id in RULE_LABELS}
    valid_rows: list[dict[str, str]] = []

    for row in rows:
        triggered_rules = validate_record(row)
        if triggered_rules:
            for rule_id in triggered_rules:
                invalid_breakdown[rule_id] += 1
        else:
            valid_rows.append(row)

    valid_count = len(valid_rows)
    invalid_count = len(rows) - valid_count

    category_counts = {category: 0 for category in sorted(VALID_CATEGORIES)}
    for row in valid_rows:
        category = _normalize_cell(row.get("category"))
        if category in category_counts:
            category_counts[category] += 1

    by_category = [
        CategoryBreakdown(
            category=category,
            count=category_counts[category],
            percentage=_percentage(category_counts[category], valid_count),
        )
        for category in CATEGORY_ORDER
        if category_counts[category] > 0
    ]

    status_counts = {status: 0 for status in ("OPEN", "CLOSED", "DISCARDED")}
    for row in valid_rows:
        status = _normalize_cell(row.get("status"))
        if status in status_counts:
            status_counts[status] += 1

    by_status = [
        StatusBreakdown(
            status=status,
            count=status_counts[status],
            percentage=_percentage(status_counts[status], valid_count),
        )
        for status in ("OPEN", "CLOSED", "DISCARDED")
        if status_counts[status] > 0
    ]

    closed_rows = [
        row for row in valid_rows if _normalize_cell(row.get("status")) == "CLOSED"
    ]
    distribution: dict[int, int] = {score: 0 for score in range(1, 6)}
    scores: list[int] = []

    for row in closed_rows:
        score = _parse_score(_normalize_cell(row.get("satisfaction_score")))
        if score is not None and 1 <= score <= 5:
            distribution[score] += 1
            scores.append(score)

    average = round(sum(scores) / len(scores), 2) if scores else 0.0

    return AnalysisResult(
        source_name=source_name,
        total_records=len(rows),
        valid_count=valid_count,
        invalid_count=invalid_count,
        invalid_breakdown={
            rule_id: count
            for rule_id, count in invalid_breakdown.items()
            if count > 0
        },
        by_category=by_category,
        by_status=by_status,
        satisfaction=SatisfactionBreakdown(
            scored_tickets=len(scores),
            closed_tickets=len(closed_rows),
            average=average,
            distribution=distribution,
        ),
    )


def _branch_line(prefix: str, label: str, value: str) -> str:
    """Render a tree branch line with dot leaders aligned to CONTEXT output."""
    head = f"  {prefix} {label}"
    dots = max(1, BRANCH_VALUE_COLUMN - len(head) - 2)
    return f"{head} {'.' * dots} {value}"


def format_console_report(result: AnalysisResult) -> str:
    """Format analysis output for CLI display."""
    lines = [
        "=" * 60,
        "  NEXOVA — SUPPORT TICKET ANALYSIS",
        f"  Source file: {result.source_name}",
        "=" * 60,
        "",
        f"TOTAL RECORDS IN FILE .......... {result.total_records}",
        f"  ├─ Valid records ................ {result.valid_count}",
        f"  └─ Invalid / incomplete .......... {result.invalid_count}",
        "",
        "INVALID RECORDS BREAKDOWN",
    ]

    invalid_items = [
        (rule_id, result.invalid_breakdown[rule_id])
        for rule_id in RULE_DISPLAY_ORDER
        if result.invalid_breakdown.get(rule_id, 0) > 0
    ]

    for index, (rule_id, count) in enumerate(invalid_items):
        prefix = "└─" if index == len(invalid_items) - 1 else "├─"
        lines.append(_branch_line(prefix, RULE_LABELS[rule_id], str(count)))

    lines.extend(["", "BREAKDOWN BY CATEGORY (valid records)"])
    for index, item in enumerate(result.by_category):
        prefix = "└─" if index == len(result.by_category) - 1 else "├─"
        lines.append(
            _branch_line(
                prefix,
                item.category,
                f"{item.count}  ({item.percentage:.1f}%)",
            )
        )

    lines.extend(["", "BREAKDOWN BY STATUS (valid records)"])
    for index, item in enumerate(result.by_status):
        prefix = "└─" if index == len(result.by_status) - 1 else "├─"
        lines.append(
            _branch_line(
                prefix,
                item.status,
                f"{item.count}  ({item.percentage:.1f}%)",
            )
        )

    lines.extend(
        [
            "",
            "SATISFACTION INDEX (closed tickets)",
            f"  Scored tickets: {result.satisfaction.scored_tickets} of "
            f"{result.satisfaction.closed_tickets}",
            f"  Average score: {result.satisfaction.average:.2f} / 5.00",
        ]
    )

    for score in range(1, 6):
        count = result.satisfaction.distribution.get(score, 0)
        label = SATISFACTION_LABELS[score]
        prefix = "└─" if score == 5 else "├─"
        lines.append(_branch_line(prefix, f"Score {score} ({label})", str(count)))

    lines.append("")
    lines.append("=" * 60)
    return "\n".join(lines)


def analysis_to_metric_rows(result: AnalysisResult) -> list[tuple[str, str]]:
    """Flatten analysis result into exportable metric rows."""
    rows: list[tuple[str, str]] = [
        ("total_records", str(result.total_records)),
        ("valid_records", str(result.valid_count)),
        ("invalid_records", str(result.invalid_count)),
    ]

    for rule_id, count in sorted(result.invalid_breakdown.items()):
        rows.append((f"invalid_{rule_id}", str(count)))

    for item in result.by_category:
        rows.append((f"category_{item.category}", str(item.count)))
        rows.append((f"category_{item.category}_pct", f"{item.percentage:.1f}"))

    for item in result.by_status:
        rows.append((f"status_{item.status}", str(item.count)))
        rows.append((f"status_{item.status}_pct", f"{item.percentage:.1f}"))

    rows.extend(
        [
            (
                "satisfaction_scored_tickets",
                str(result.satisfaction.scored_tickets),
            ),
            (
                "satisfaction_closed_tickets",
                str(result.satisfaction.closed_tickets),
            ),
            ("satisfaction_average", f"{result.satisfaction.average:.2f}"),
        ]
    )

    for score in range(1, 6):
        rows.append(
            (
                f"satisfaction_score_{score}",
                str(result.satisfaction.distribution.get(score, 0)),
            )
        )

    return rows


def export_results_csv(result: AnalysisResult, output_path: str | Path) -> None:
    """Write one metric per row to a CSV file."""
    path = Path(output_path)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["metric", "value"])
        writer.writerows(analysis_to_metric_rows(result))


def results_csv_text(result: AnalysisResult) -> str:
    """Return CSV export content as text."""
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["metric", "value"])
    writer.writerows(analysis_to_metric_rows(result))
    return buffer.getvalue()
