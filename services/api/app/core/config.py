"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    jwt_secret_key: str
    access_token_expire_minutes: int
    jwt_algorithm: str
    password_reset_expire_minutes: int
    password_reset_base_url: str
    resend_api_key: str | None
    resend_from_email: str


def _require_secret_key() -> str:
    secret = os.environ.get("JWT_SECRET_KEY")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY environment variable is required. "
            "Set it in services/api/.env or your deployment environment."
        )
    return secret


@lru_cache
def get_settings() -> Settings:
    expire_raw = os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    reset_expire_raw = os.environ.get("PASSWORD_RESET_EXPIRE_MINUTES", "30")
    resend_key = (os.environ.get("RESEND_API_KEY") or "").strip() or None
    return Settings(
        jwt_secret_key=_require_secret_key(),
        access_token_expire_minutes=int(expire_raw),
        jwt_algorithm=os.environ.get("JWT_ALGORITHM", "HS256"),
        password_reset_expire_minutes=int(reset_expire_raw),
        password_reset_base_url=os.environ.get(
            "PASSWORD_RESET_BASE_URL",
            "http://localhost:3000/reset-password",
        ),
        resend_api_key=resend_key if resend_key else None,
        resend_from_email=os.environ.get(
            "RESEND_FROM_EMAIL",
            "onboarding@resend.dev",
        ),
    )


def clear_settings_cache() -> None:
    get_settings.cache_clear()
