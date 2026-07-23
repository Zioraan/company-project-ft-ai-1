"""Transactional email delivery for password reset."""

from __future__ import annotations

import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)

FORGOT_PASSWORD_MESSAGE = (
    "If that address is registered, you'll receive a link shortly."
)


class EmailDeliveryError(Exception):
    """Raised when a transactional email cannot be delivered."""


def send_password_reset_email(*, to_email: str, reset_url: str) -> None:
    settings = get_settings()

    if not settings.resend_api_key:
        logger.info("password_reset_email_dev_fallback triggered")
        return

    import resend

    resend.api_key = settings.resend_api_key
    try:
        resend.Emails.send(
            {
                "from": settings.resend_from_email,
                "to": [to_email],
                "subject": "Reset your Nexova password",
                "text": (
                    "You requested a password reset for your Nexova account.\n\n"
                    f"Reset your password: {reset_url}\n\n"
                    "If you did not request this, you can ignore this email."
                ),
            }
        )
    except Exception as exc:
        logger.exception("password_reset_email_delivery_failed")
        raise EmailDeliveryError("Password reset email could not be sent.") from exc
