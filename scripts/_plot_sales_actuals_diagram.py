"""One-off chart: actual vs predicted sales for diagram use."""

from pathlib import Path

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "artifacts" / "sales_forecast" / "predictions.csv"
OUT_PATH = ROOT / "data" / "artifacts" / "sales_forecast" / "actual_results_diagram.png"


def main() -> None:
    df = pd.read_csv(CSV_PATH, parse_dates=["month"]).sort_values("month")

    fig, ax = plt.subplots(figsize=(12, 5.5), dpi=160)

    ax.fill_between(
        df["month"],
        df["interval_lower_usd"] / 1e6,
        df["interval_upper_usd"] / 1e6,
        color="#94a3b8",
        alpha=0.28,
        label="RF 90% interval",
        zorder=1,
    )
    ax.plot(
        df["month"],
        df["seasonal_naive_usd"] / 1e6,
        color="#64748b",
        linestyle="--",
        linewidth=1.6,
        label="Seasonal naive",
        zorder=2,
    )
    ax.plot(
        df["month"],
        df["rf_prediction_usd"] / 1e6,
        color="#2563eb",
        linewidth=2.0,
        label="RF prediction",
        zorder=3,
    )
    ax.plot(
        df["month"],
        df["actual_revenue_usd"] / 1e6,
        color="#0f172a",
        linewidth=2.4,
        marker="o",
        markersize=4.5,
        label="Actual revenue",
        zorder=4,
    )

    ax.set_title(
        "Nexova sales — actual vs predicted (2024–2025 test window)",
        fontsize=13,
        pad=12,
    )
    ax.set_ylabel("Revenue (USD millions)")
    ax.set_xlabel("Month")
    ax.yaxis.set_major_formatter(lambda x, _pos: f"{x:.1f}M")
    ax.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))
    ax.grid(True, axis="y", color="#e2e8f0", linewidth=0.8)
    ax.set_axisbelow(True)
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    ax.legend(loc="upper left", frameon=False, ncol=2)
    fig.autofmt_xdate(rotation=35, ha="right")
    fig.tight_layout()
    fig.savefig(OUT_PATH, bbox_inches="tight", facecolor="white")
    print(f"wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
