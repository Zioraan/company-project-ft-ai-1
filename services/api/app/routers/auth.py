"""Authentication API routes."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.dependencies import get_current_user
from app.core.email import (
    FORGOT_PASSWORD_MESSAGE,
    EmailDeliveryError,
    send_password_reset_email,
)
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
)
from app.schemas.auth import (
    ChangePasswordSchema,
    ForgotPasswordSchema,
    LoginSchema,
    MessageSchema,
    ResetPasswordSchema,
    TokenSchema,
)
from app.schemas.users import UserCreateSchema, UserResponseSchema, UserUpdateSchema
from app.store import reset_tokens_store, users_store
from app.store.users_store import DuplicateEmailError

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger(__name__)

REGISTRATION_CONFLICT_MESSAGE = "Registration could not be completed."


@router.post("/login", response_model=TokenSchema)
def login_route(payload: LoginSchema) -> TokenSchema:
    user = users_store.verify_user_credentials(payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return TokenSchema(access_token=access_token)


@router.post("/register", response_model=TokenSchema, status_code=status.HTTP_201_CREATED)
def register_route(payload: UserCreateSchema) -> TokenSchema:
    try:
        user = users_store.create_user(payload)
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=REGISTRATION_CONFLICT_MESSAGE,
        ) from exc

    access_token = create_access_token(subject=user.id)
    return TokenSchema(access_token=access_token)


@router.get("/me", response_model=UserResponseSchema)
def me_route(
    current_user: Annotated[UserResponseSchema, Depends(get_current_user)],
) -> UserResponseSchema:
    return current_user


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password_route(
    payload: ChangePasswordSchema,
    current_user: Annotated[UserResponseSchema, Depends(get_current_user)],
) -> Response:
    updated = users_store.change_user_password(
        current_user.id,
        payload.current_password,
        payload.new_password,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/forgot-password", response_model=MessageSchema)
def forgot_password_route(payload: ForgotPasswordSchema) -> MessageSchema:
    user = users_store.get_user_by_email(payload.email)
    if user is not None:
        from app.core.config import get_settings

        settings = get_settings()
        token, jti = create_password_reset_token(user.id)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.password_reset_expire_minutes
        )
        reset_tokens_store.create_reset_token_record(jti, user.id, expires_at)
        separator = "&" if "?" in settings.password_reset_base_url else "?"
        reset_url = f"{settings.password_reset_base_url}{separator}token={token}"
        try:
            send_password_reset_email(to_email=user.email, reset_url=reset_url)
        except EmailDeliveryError:
            logger.exception("forgot_password_email_delivery_failed")

    return MessageSchema(message=FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=MessageSchema)
def reset_password_route(payload: ResetPasswordSchema) -> MessageSchema:
    try:
        claims = decode_password_reset_token(payload.token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        ) from exc

    jti = claims.get("jti")
    user_id = claims.get("sub")
    if not isinstance(jti, str) or not isinstance(user_id, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    if not reset_tokens_store.is_reset_token_valid(jti):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    updated = users_store.update_user(
        user_id,
        UserUpdateSchema(password=payload.new_password),
    )
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    reset_tokens_store.mark_reset_token_used(jti)
    return MessageSchema(message="Password updated successfully.")
