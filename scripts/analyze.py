#!/usr/bin/env python3
"""CLI for Nexova incident CSV analysis."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

from domain.incident_analysis import (  # noqa: E402
    CsvParseError,
    EmptyFileError,
    IncidentAnalysisError,
    MissingHeaderError,
    NoDataRowsError,
    analyze_incidents,
    export_results_csv,
    format_console_report,
    load_incidents,
)


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")


def _validate_csv_path(csv_path: Path) -> str | None:
    if not csv_path.exists():
        return "CSV file not found."
    if csv_path.suffix.lower() != ".csv":
        return "Input file must have a .csv extension."
    return None


def _incident_load_error_message(exc: IncidentAnalysisError) -> str:
    if isinstance(exc, EmptyFileError):
        return "CSV file is empty."
    if isinstance(exc, MissingHeaderError):
        return "CSV file is missing required columns or has an invalid header."
    if isinstance(exc, NoDataRowsError):
        return "CSV file contains no data rows."
    if isinstance(exc, CsvParseError):
        return "Unable to parse CSV content."
    return "Unable to read the CSV file."


def main() -> int:
    _configure_stdout()

    if len(sys.argv) != 2:
        print("Usage: python analyze.py <path-to-csv>", file=sys.stderr)
        return 1

    csv_path = Path(sys.argv[1])
    path_error = _validate_csv_path(csv_path)
    if path_error is not None:
        print(path_error, file=sys.stderr)
        return 1

    try:
        source_name, rows = load_incidents(csv_path)
    except FileNotFoundError:
        print("CSV file not found.", file=sys.stderr)
        return 1
    except IncidentAnalysisError as exc:
        print(_incident_load_error_message(exc), file=sys.stderr)
        return 1

    result = analyze_incidents(rows, source_name=source_name)
    print(format_console_report(result))

    try:
        answer = input("Export results to CSV? [y / n]: ").strip().lower()
    except EOFError:
        answer = "n"

    if answer == "y":
        output_path = Path("results.csv")
        try:
            export_results_csv(result, output_path)
        except OSError:
            print("Unable to export results to CSV.", file=sys.stderr)
            return 1
        print(f"Results exported to {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
