"""User management API routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.schemas.users import (
    UserCreateSchema,
    UserResponseSchema,
    UserUpdateSchema,
)
from app.store import users_store
from app.store.users_store import DuplicateEmailError

router = APIRouter(prefix="/users", tags=["users"])

CREATE_CONFLICT_MESSAGE = "A user with this email already exists."
UPDATE_CONFLICT_MESSAGE = "Update could not be completed."


@router.post("/", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
def create_user_route(payload: UserCreateSchema) -> UserResponseSchema:
    try:
        return users_store.create_user(payload)
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=CREATE_CONFLICT_MESSAGE,
        ) from exc


@router.get("/", response_model=list[UserResponseSchema])
def list_users_route(
    _current_user: Annotated[UserResponseSchema, Depends(get_current_user)],
) -> list[UserResponseSchema]:
    return users_store.list_users()


@router.get("/{user_id}", response_model=UserResponseSchema)
def get_user_route(
    user_id: str,
    _current_user: Annotated[UserResponseSchema, Depends(get_current_user)],
) -> UserResponseSchema:
    user = users_store.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@router.put("/{user_id}", response_model=UserResponseSchema)
def update_user_route(
    user_id: str,
    payload: UserUpdateSchema,
    current_user: Annotated[UserResponseSchema, Depends(get_current_user)],
) -> UserResponseSchema:
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own user profile.",
        )

    try:
        user = users_store.update_user(user_id, payload)
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=UPDATE_CONFLICT_MESSAGE,
        ) from exc
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_route(
    user_id: str,
    current_user: Annotated[UserResponseSchema, Depends(get_current_user)],
) -> None:
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own user account.",
        )

    deleted = users_store.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
