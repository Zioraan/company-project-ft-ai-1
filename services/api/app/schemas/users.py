"""Pydantic schemas for user management API."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str | None = Field(default=None, max_length=120)


class UserUpdateSchema(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8)
    name: str | None = Field(default=None, max_length=120)
    is_active: bool | None = None


class UserResponseSchema(BaseModel):
    id: str
    email: EmailStr
    name: str
    is_active: bool
    created_at: datetime
