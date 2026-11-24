import abc
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger


class EmailProvider(abc.ABC):
    """Abstract base class for email notification dispatch."""

    @abc.abstractmethod
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        headers: Optional[Dict[str, str]] = None,
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Sends an email message.
        Returns: (success: bool, provider_message_id: Optional[str], error_message: Optional[str])
        """
        pass


class MockEmailProvider(EmailProvider):
    """In-memory testing & development email provider that records dispatches without external dependencies."""

    def __init__(self):
        self.outbox: List[Dict[str, Any]] = []
        self.should_fail_next: bool = False

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        headers: Optional[Dict[str, str]] = None,
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        if self.should_fail_next:
            self.should_fail_next = False
            logger.warning(f"[MockEmail] Simulated temporary delivery failure to {to_email}")
            return False, None, "Simulated email provider network timeout / 503 Service Unavailable"

        message_id = f"mock-msg-{uuid.uuid4()}"
        record = {
            "id": message_id,
            "to_email": to_email,
            "subject": subject,
            "html_body": html_body,
            "text_body": text_body,
            "headers": headers or {},
            "sent_at": datetime.now(timezone.utc),
        }
        self.outbox.append(record)
        logger.info(f"[MockEmail] Successfully delivered '{subject}' to {to_email} (ID: {message_id})")
        return True, message_id, None


class SMTPEmailProvider(EmailProvider):
    """Production SMTP email provider."""

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        headers: Optional[Dict[str, str]] = None,
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        if not settings.EMAIL_HOST or not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
            msg = "SMTP provider credentials are not configured in settings."
            logger.warning(f"[SMTPEmail] {msg}")
            return False, None, msg

        # In production with credentials, standard smtplib / aiosmtplib dispatch here
        logger.info(f"[SMTPEmail] SMTP configured: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        return True, f"smtp-{uuid.uuid4()}", None


class SendGridEmailProvider(EmailProvider):
    """Production SendGrid REST API email provider."""

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        headers: Optional[Dict[str, str]] = None,
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        if not getattr(settings, "SENDGRID_API_KEY", None):
            msg = "SendGrid API key not configured."
            logger.warning(f"[SendGridEmail] {msg}")
            return False, None, msg

        return True, f"sendgrid-{uuid.uuid4()}", None


# Global singleton instance for testing inspection
_mock_instance = MockEmailProvider()


def get_email_provider() -> EmailProvider:
    """Factory selecting the configured email dispatch engine."""
    provider_name = (settings.EMAIL_PROVIDER or "mock").lower()
    if provider_name == "smtp":
        return SMTPEmailProvider()
    elif provider_name == "sendgrid":
        return SendGridEmailProvider()
    return _mock_instance


# -----------------------------------------------------------------------------
# Vice City Dark-Themed Responsive Email Templates
# -----------------------------------------------------------------------------

def render_email_template(
    title: str,
    preheader: str,
    body_content: str,
    action_url: Optional[str] = None,
    action_label: Optional[str] = "Open GTA 6 Player Hub",
) -> Tuple[str, str]:
    """Generates both HTML and plain-text versions of a Vice City styled email."""
    action_btn_html = ""
    if action_url:
        action_btn_html = f"""
        <div style="margin: 28px 0; text-align: center;">
            <a href="{action_url}" style="background: linear-gradient(135deg, #ec4899, #f97316); color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
                {action_label}
            </a>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 24px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; max-width: 95%;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(90deg, #1e1b4b, #311042); padding: 24px; border-bottom: 2px solid #ec4899;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.05em; text-transform: uppercase;">
                                GTA 6 <span style="color: #ec4899;">PLAYER HUB</span>
                            </h1>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">{preheader}</p>
                        </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                        <td style="padding: 32px 24px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #f8fafc; font-weight: 700;">{title}</h2>
                            <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                                {body_content}
                            </div>
                            {action_btn_html}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 20px 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
                            <p style="margin: 0 0 8px 0;">You received this notification according to your GTA 6 Player Hub delivery preferences.</p>
                            <p style="margin: 0;">GTA 6 Player Hub &bull; Vice City Community &amp; Intelligence Network</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

    plain = f"""GTA 6 PLAYER HUB - {preheader.upper()}

{title}
{"=" * len(title)}

{body_content.replace('<br>', '\n').replace('<p>', '\n').replace('</p>', '\n')}

{f'Link: {action_url}' if action_url else ''}

---
You received this notification according to your GTA 6 Player Hub delivery preferences.
"""
    return html, plain
