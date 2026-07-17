"""Lazy access to the FastAPI reporting router for boundary documentation."""

from __future__ import annotations


def get_router():
    from app.routers.reporting import router

    return router
