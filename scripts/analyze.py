#!/usr/bin/env python3
"""CLI for Nexova incident CSV analysis."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

from domain.incident_analysis import (  # noqa: E402
    export_results_csv,
    format_console_report,
    load_incidents,
)


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")


def main() -> int:
    _configure_stdout()

    if len(sys.argv) != 2:
        print("Usage: python analyze.py <path-to-csv>", file=sys.stderr)
        return 1

    csv_path = Path(sys.argv[1])
    try:
        source_name, rows = load_incidents(csv_path)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Error reading CSV: {exc}", file=sys.stderr)
        return 1

    from domain.incident_analysis import analyze_incidents

    result = analyze_incidents(rows, source_name=source_name)
    print(format_console_report(result))

    try:
        answer = input("Export results to CSV? [y / n]: ").strip().lower()
    except EOFError:
        answer = "n"

    if answer == "y":
        output_path = Path("results.csv")
        export_results_csv(result, output_path)
        print(f"Results exported to {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
