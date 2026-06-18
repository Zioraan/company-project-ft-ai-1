"""Manual supplier seed entrypoint: python -m app.seed (from services/api)."""

from __future__ import annotations

from app.seed.suppliers_seed import SUPPLIERS_SEED
from app.store.suppliers_store import seed_suppliers


def main() -> None:
    result = seed_suppliers(SUPPLIERS_SEED)
    print("inserted", result["inserted"])
    print("skipped", result["skipped"])


if __name__ == "__main__":
    main()
