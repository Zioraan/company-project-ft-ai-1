"""Password hashing and JWT token utilities."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token.") from exc


def create_password_reset_token(user_id: str) -> tuple[str, str]:
    settings = get_settings()
    jti = str(uuid4())
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.password_reset_expire_minutes
    )
    payload = {
        "sub": user_id,
        "jti": jti,
        "type": "password_reset",
        "exp": expire,
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token, jti


def decode_password_reset_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token.") from exc

    if payload.get("type") != "password_reset":
        raise ValueError("Invalid token type.")

    return payload
