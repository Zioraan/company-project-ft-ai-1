"""Idempotent seed data for inventory tables."""

from __future__ import annotations

SYSTEM_SEED_USER_UUID = "00000000-0000-4000-8000-000000000001"

INVENTORY_SEED: dict = {
    "assets": [
        {
            "name": 'Laptop 14" Business',
            "sku": "NXV-IT-001",
            "category": "hardware",
            "office": "Valencia",
        },
        {
            "name": 'Laptop 14" Business',
            "sku": "NXV-IT-002",
            "category": "hardware",
            "office": "Miami",
        },
        {
            "name": "Ergonomic mouse",
            "sku": "NXV-PER-001",
            "category": "peripherals",
            "office": "Valencia",
        },
        {
            "name": "USB-C Hub",
            "sku": "NXV-PER-002",
            "category": "peripherals",
            "office": "Miami",
        },
        {
            "name": "A4 paper ream",
            "sku": "NXV-OFF-001",
            "category": "office_supplies",
            "office": "Valencia",
        },
        {
            "name": "Leadership training workbook",
            "sku": "NXV-TRN-001",
            "category": "training_materials",
            "office": "Valencia",
        },
    ],
    "entries": [
        {
            "sku": "NXV-IT-001",
            "quantity": 10,
            "supplier": "TechDistrib Valencia S.L.",
            "office": "Valencia",
            "user_uuid": SYSTEM_SEED_USER_UUID,
        },
        {
            "sku": "NXV-IT-001",
            "quantity": 5,
            "supplier": "TechDistrib Valencia S.L.",
            "office": "Valencia",
            "user_uuid": SYSTEM_SEED_USER_UUID,
        },
        {
            "sku": "NXV-PER-001",
            "quantity": 20,
            "supplier": "Office Depot Miami",
            "office": "Valencia",
            "user_uuid": SYSTEM_SEED_USER_UUID,
        },
        {
            "sku": "NXV-OFF-001",
            "quantity": 50,
            "supplier": "Office Depot Miami",
            "office": "Valencia",
            "user_uuid": SYSTEM_SEED_USER_UUID,
        },
    ],
    "exits": [
        {
            "sku": "NXV-IT-001",
            "quantity": 3,
            "exit_type": "allocation",
            "assigned_to": "Ana García",
            "office": "Valencia",
            "user_uuid": SYSTEM_SEED_USER_UUID,
        },
        {
            "sku": "NXV-OFF-001",
            "quantity": 5,
            "exit_type": "consumption",
            "assigned_to": None,
            "office": "Valencia",
            "user_uuid": SYSTEM_SEED_USER_UUID,
        },
        {
            "sku": "NXV-PER-001",
            "quantity": 2,
            "exit_type": "allocation",
            "assigned_to": "Carlos Ruiz",
            "office": "Valencia",
            "user_uuid": SYSTEM_SEED_USER_UUID,
        },
    ],
}
