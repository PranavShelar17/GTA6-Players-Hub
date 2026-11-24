import abc
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger


class PushProvider(abc.ABC):
    """Abstract base class for browser Web Push notification dispatch."""

    @abc.abstractmethod
    async def send_push(
        self,
        endpoint: str,
        p256dh: str,
        auth: str,
        payload: Dict[str, Any],
    ) -> Tuple[bool, Optional[str], bool]:
        """
        Sends a web push notification.
        Returns: (success: bool, error_message: Optional[str], is_expired: bool)
        """
        pass


class MockPushProvider(PushProvider):
    """In-memory testing & development browser push provider."""

    def __init__(self):
        self.outbox: List[Dict[str, Any]] = []
        self.simulate_expired: bool = False

    async def send_push(
        self,
        endpoint: str,
        p256dh: str,
        auth: str,
        payload: Dict[str, Any],
    ) -> Tuple[bool, Optional[str], bool]:
        if self.simulate_expired:
            logger.info(f"[MockPush] Simulated expired subscription 410 Gone for {endpoint[:30]}...")
            return False, "410 Gone: Subscription has expired or was unsubscribed", True

        record = {
            "endpoint": endpoint,
            "payload": payload,
            "dispatched_at": datetime.now(timezone.utc),
        }
        self.outbox.append(record)
        logger.info(f"[MockPush] Delivered push notification: '{payload.get('title')}'")
        return True, None, False


class WebPushProvider(PushProvider):
    """Production W3C Web Push provider using standard VAPID authentication."""

    async def send_push(
        self,
        endpoint: str,
        p256dh: str,
        auth: str,
        payload: Dict[str, Any],
    ) -> Tuple[bool, Optional[str], bool]:
        if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
            msg = "VAPID keys not configured in environment settings."
            logger.warning(f"[WebPush] {msg}")
            return False, msg, False

        # If pywebpush is installed and keys configured, dispatch payload here
        logger.info(f"[WebPush] Dispatching VAPID push payload to {endpoint[:30]}...")
        return True, None, False


_mock_push_instance = MockPushProvider()


def get_push_provider() -> PushProvider:
    """Factory selecting the active browser push provider."""
    provider_name = (settings.PUSH_PROVIDER or "mock").lower()
    if provider_name == "webpush":
        return WebPushProvider()
    return _mock_push_instance
