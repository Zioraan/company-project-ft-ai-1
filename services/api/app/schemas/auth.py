"""Pydantic schemas for authentication API."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordSchema(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class MessageSchema(BaseModel):
    message: str
