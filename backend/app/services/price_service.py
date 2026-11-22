from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.price import PriceAlert, PriceAlertEvent, PriceObservation, PriceRegion
from app.core.logging import logger

# Freshness window: prices older than 72 hours are marked STALE
FRESHNESS_WINDOW_HOURS = 72


def calculate_discount_percentage(current_price: Decimal, original_price: Optional[Decimal]) -> Decimal:
    """Calculates valid discount percentage.
    Returns 0.00 if original_price is None or <= current_price.
    """
    if original_price is None or original_price <= Decimal("0.00"):
        return Decimal("0.00")
    if original_price <= current_price:
        return Decimal("0.00")

    diff = original_price - current_price
    pct = (diff / original_price) * Decimal("100.00")
    return pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def check_verification_status(raw_status: str, observed_at: datetime) -> str:
    """Evaluates whether an observation is VERIFIED or has transitioned to STALE."""
    if raw_status in ("UNAVAILABLE", "UNVERIFIED"):
        return raw_status

    now = datetime.now(timezone.utc)
    # Ensure timezone awareness
    if observed_at.tzinfo is None:
        observed_at = observed_at.replace(tzinfo=timezone.utc)

    if (now - observed_at) > timedelta(hours=FRESHNESS_WINDOW_HOURS):
        return "STALE"
    return "VERIFIED"


def convert_currency_to_inr(
    amount: Decimal, 
    region: PriceRegion
) -> Tuple[Decimal, Decimal, datetime]:
    """Converts a regional amount to INR using verified reference forex rates."""
    if region.currency_code == "INR":
        return amount, Decimal("1.0000"), region.rates_last_updated

    rate = region.exchange_rate_to_inr
    converted = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return converted, rate, region.rates_last_updated


async def evaluate_and_trigger_alerts(
    db: AsyncSession, 
    observation: PriceObservation
) -> int:
    """Evaluates active player price alerts for the product and region.
    Records PriceAlertEvent if target price condition is met.
    """
    if observation.verification_status not in ("VERIFIED",):
        return 0

    stmt = select(PriceAlert).where(
        PriceAlert.product_id == observation.product_id,
        PriceAlert.region_id == observation.region_id,
        PriceAlert.is_active.is_(True),
        PriceAlert.target_price >= observation.current_price
    )
    res = await db.execute(stmt)
    alerts = res.scalars().all()

    triggered_count = 0
    now = datetime.now(timezone.utc)

    for alert in alerts:
        # Prevent rapid duplicate alert events if triggered within the last 24 hours
        if alert.last_triggered_at:
            last_trig = alert.last_triggered_at
            if last_trig.tzinfo is None:
                last_trig = last_trig.replace(tzinfo=timezone.utc)
            if (now - last_trig) < timedelta(hours=24):
                continue

        event = PriceAlertEvent(
            alert_id=alert.id,
            observed_price=observation.current_price,
            currency_code=observation.currency_code,
            delivery_status="RECORDED",
            triggered_at=now
        )
        db.add(event)
        alert.last_triggered_at = now
        triggered_count += 1

    if triggered_count > 0:
        await db.commit()
        logger.info(f"Triggered {triggered_count} price alert events for product {observation.product_id}")

    return triggered_count
