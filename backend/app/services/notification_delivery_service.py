import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.integrations.email_provider import get_email_provider, render_email_template
from app.integrations.push_provider import get_push_provider
from app.models.notification import (
    Notification,
    NotificationDelivery,
    NotificationPreference,
    PushSubscription,
)
from app.models.user import PlayerProfile


class NotificationDeliveryService:
    """Service orchestrating multi-channel delivery (In-App, Email, Push) and retry processing."""

    @staticmethod
    async def process_email_deliveries(
        session: AsyncSession,
        max_batch_size: int = 50,
    ) -> Dict[str, Any]:
        """Processes queued email deliveries, enforcing user preferences, templates, and delivery tracking."""
        now = datetime.now(timezone.utc)
        provider = get_email_provider()
        delivered_count = 0
        failed_count = 0
        skipped_count = 0

        # Query pending or retryable email deliveries
        stmt = (
            select(NotificationDelivery)
            .options(selectinload(NotificationDelivery.notification))
            .where(
                NotificationDelivery.channel == "EMAIL",
                NotificationDelivery.status.in_(["PENDING", "SENT", "FAILED"]),
                NotificationDelivery.retry_count < 3,
            )
            .limit(max_batch_size)
        )
        res = await session.execute(stmt)
        deliveries = res.scalars().all()

        for delivery in deliveries:
            notif = delivery.notification
            if not notif:
                delivery.status = "FAILED"
                delivery.error_message = "Associated notification was deleted"
                continue

            user_id = notif.user_id

            # Check player preferences
            pref_stmt = select(NotificationPreference).where(NotificationPreference.user_id == user_id)
            pref_res = await session.execute(pref_stmt)
            pref = pref_res.scalar_one_or_none()

            if pref and not pref.email_enabled:
                delivery.status = "SKIPPED"
                delivery.error_message = "Player has disabled email notifications"
                skipped_count += 1
                continue

            # Query player email from profile
            profile_stmt = select(PlayerProfile).where(PlayerProfile.user_id == user_id)
            profile_res = await session.execute(profile_stmt)
            profile = profile_res.scalar_one_or_none()

            to_email = f"{profile.username}@example.com" if profile and profile.username else f"player-{user_id}@example.com"

            # Render template
            html, plain = render_email_template(
                title=notif.title,
                preheader=f"GTA 6 Player Hub Alert - {notif.notification_type}",
                body_content=f"<p>{notif.message}</p>",
                action_url=notif.reference_url,
                action_label="View on GTA 6 Player Hub",
            )

            delivery.attempted_at = now
            success, msg_id, err = await provider.send_email(
                to_email=to_email,
                subject=f"[GTA 6 Hub] {notif.title}",
                html_body=html,
                text_body=plain,
            )

            if success:
                delivery.status = "DELIVERED"
                delivery.delivered_at = now
                delivery.provider_reference = msg_id
                delivery.error_message = None
                delivered_count += 1
            else:
                delivery.status = "FAILED"
                delivery.retry_count += 1
                delivery.error_message = err
                failed_count += 1

        await session.commit()

        return {
            "processed": len(deliveries),
            "delivered": delivered_count,
            "failed": failed_count,
            "skipped": skipped_count,
            "timestamp": now.isoformat(),
        }

    @staticmethod
    async def process_push_deliveries(
        session: AsyncSession,
        max_batch_size: int = 50,
    ) -> Dict[str, Any]:
        """Processes queued Web Push deliveries with subscription verification and expiration handling."""
        now = datetime.now(timezone.utc)
        provider = get_push_provider()
        delivered_count = 0
        failed_count = 0
        expired_count = 0

        stmt = (
            select(NotificationDelivery)
            .options(selectinload(NotificationDelivery.notification))
            .where(
                NotificationDelivery.channel == "PUSH",
                NotificationDelivery.status.in_(["PENDING", "SENT", "FAILED"]),
                NotificationDelivery.retry_count < 3,
            )
            .limit(max_batch_size)
        )
        res = await session.execute(stmt)
        deliveries = res.scalars().all()

        for delivery in deliveries:
            notif = delivery.notification
            if not notif:
                delivery.status = "FAILED"
                delivery.error_message = "Associated notification was deleted"
                continue

            # Query active push subscriptions
            sub_stmt = select(PushSubscription).where(
                PushSubscription.user_id == notif.user_id,
                PushSubscription.is_active.is_(True),
            )
            sub_res = await session.execute(sub_stmt)
            subs = sub_res.scalars().all()

            if not subs:
                delivery.status = "SKIPPED"
                delivery.error_message = "No active push subscription registered"
                continue

            delivery_success = True
            delivery.attempted_at = now

            for sub in subs:
                payload = {
                    "title": notif.title,
                    "body": notif.message,
                    "url": notif.reference_url or "/notifications",
                    "tag": f"gta6-{notif.notification_type.lower()}",
                }
                success, err, is_expired = await provider.send_push(
                    endpoint=sub.endpoint,
                    p256dh=sub.p256dh,
                    auth=sub.auth,
                    payload=payload,
                )
                if is_expired:
                    sub.is_active = False
                    expired_count += 1
                    delivery_success = False
                elif not success:
                    delivery_success = False

            if delivery_success:
                delivery.status = "DELIVERED"
                delivery.delivered_at = now
                delivery.error_message = None
                delivered_count += 1
            else:
                delivery.status = "FAILED"
                delivery.retry_count += 1
                delivery.error_message = "Failed delivering to one or more push endpoints"
                failed_count += 1

        await session.commit()

        return {
            "processed": len(deliveries),
            "delivered": delivered_count,
            "failed": failed_count,
            "subscriptions_expired": expired_count,
            "timestamp": now.isoformat(),
        }

    @staticmethod
    async def retry_failed_deliveries(session: AsyncSession) -> Dict[str, Any]:
        """Retries all temporarily failed email and push notification deliveries."""
        email_res = await NotificationDeliveryService.process_email_deliveries(session)
        push_res = await NotificationDeliveryService.process_push_deliveries(session)
        return {
            "email_retries": email_res,
            "push_retries": push_res,
        }
