"""Tests for analyze.py CLI exit codes."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
ANALYZE_SCRIPT = ROOT_DIR / "scripts" / "analyze.py"
FIXTURE = ROOT_DIR / "tests" / "fixtures" / "incidents-synthetic.csv"


def _run_analyze(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(ANALYZE_SCRIPT), *args],
        cwd=ROOT_DIR,
        capture_output=True,
        text=True,
        input="n\n",
    )


def test_analyze_missing_file_exits_nonzero() -> None:
    result = _run_analyze("missing-file.csv")
    assert result.returncode == 1
    assert "not found" in result.stderr.lower()


def test_analyze_invalid_extension_exits_nonzero(tmp_path: Path) -> None:
    bad_file = tmp_path / "data.txt"
    bad_file.write_text("ticket_id\n1\n", encoding="utf-8")

    result = _run_analyze(str(bad_file))
    assert result.returncode == 1
    assert ".csv" in result.stderr.lower()


def test_analyze_valid_fixture_exits_zero() -> None:
    result = _run_analyze(str(FIXTURE))
    assert result.returncode == 0
