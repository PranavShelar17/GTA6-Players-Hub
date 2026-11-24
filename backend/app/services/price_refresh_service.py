import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.integrations.price_sources import PriceSourceConnector, STORE_CONNECTORS
from app.models.automation import DataIngestionLog, DataSourceStatus
from app.models.price import (
    PriceAlert,
    PriceAlertEvent,
    PriceObservation,
    PriceProduct,
    PriceRegion,
    PriceStore,
)
from app.services.data_validation_service import DataValidationService
from app.services.notification_service import create_player_notification


class PriceRefreshService:
    """Service orchestrating automated retailer price refresh, price drop detection, and alert triggers."""

    @staticmethod
    async def run_price_refresh(
        session: AsyncSession,
        simulate_promotions: bool = False,
    ) -> Dict[str, Any]:
        """Refreshes prices across approved stores and regions, checking for price drops and alerts."""
        connector = PriceSourceConnector()
        now = datetime.now(timezone.utc)
        total_retrieved = 0
        total_created = 0
        total_skipped = 0
        total_failed = 0
        alerts_triggered = 0

        # Pre-cache products, stores, and regions
        prod_map: Dict[str, PriceProduct] = {}
        prod_res = await session.execute(select(PriceProduct))
        for p in prod_res.scalars().all():
            prod_map[p.slug] = p

        store_map: Dict[str, PriceStore] = {}
        store_res = await session.execute(select(PriceStore))
        for s in store_res.scalars().all():
            store_map[s.store_name] = s

        region_map: Dict[str, PriceRegion] = {}
        region_res = await session.execute(select(PriceRegion))
        for r in region_res.scalars().all():
            region_map[r.country_code] = r

        target_regions = ["IND", "USA", "GBR", "EUR", "ARE"]

        for store_cfg in STORE_CONNECTORS:
            store_name = store_cfg["store_name"]
            ingestion_log = DataIngestionLog(
                source_id=store_name,
                data_category="PRICES",
                started_at=now,
                status="RUNNING",
            )
            session.add(ingestion_log)
            await session.flush()

            # Track DataSourceStatus
            src_status_stmt = select(DataSourceStatus).where(DataSourceStatus.source_name == store_name)
            src_status_res = await session.execute(src_status_stmt)
            src_status = src_status_res.scalar_one_or_none()
            if not src_status:
                src_status = DataSourceStatus(
                    source_name=store_name,
                    source_type="PRICES",
                    source_url=store_cfg.get("website_url"),
                    health_status="HEALTHY",
                    created_at=now,
                    updated_at=now,
                )
                session.add(src_status)
                await session.flush()

            src_status.last_attempted_at = now

            try:
                for country_code in target_regions:
                    raw_obs = await connector.fetch_store_observations(
                        store_name=store_name,
                        country_code=country_code,
                        discount_simulation=simulate_promotions,
                    )
                    ingestion_log.records_retrieved += len(raw_obs)
                    total_retrieved += len(raw_obs)

                    db_region = region_map.get(country_code)
                    db_store = store_map.get(store_name)
                    if not db_region or not db_store:
                        continue

                    for item in raw_obs:
                        is_valid, normalized, errs = DataValidationService.validate_price_observation(item)
                        if not is_valid:
                            ingestion_log.records_failed += 1
                            total_failed += 1
                            continue

                        product = prod_map.get(normalized.get("product_slug", ""))
                        if not product:
                            ingestion_log.records_skipped += 1
                            total_skipped += 1
                            continue

                        # Check previous observation for price change detection
                        prev_stmt = (
                            select(PriceObservation)
                            .where(
                                PriceObservation.product_id == product.id,
                                PriceObservation.store_id == db_store.id,
                                PriceObservation.region_id == db_region.id,
                            )
                            .order_by(desc(PriceObservation.observed_at))
                            .limit(1)
                        )
                        prev_res = await session.execute(prev_stmt)
                        prev_obs = prev_res.scalar_one_or_none()

                        curr_price: Decimal = normalized["current_price"]
                        orig_price: Optional[Decimal] = normalized["original_price"]
                        disc_pct: Optional[Decimal] = normalized["discount_percentage"]

                        # Deduplication: If price and availability match most recent observation within 2 hours, skip duplicate record
                        if prev_obs and prev_obs.current_price == curr_price and prev_obs.is_available == normalized["is_available"]:
                            time_diff = now - prev_obs.observed_at
                            if time_diff < timedelta(hours=2):
                                ingestion_log.records_skipped += 1
                                total_skipped += 1
                                continue

                        # Save new observation
                        new_obs = PriceObservation(
                            product_id=product.id,
                            store_id=db_store.id,
                            region_id=db_region.id,
                            current_price=curr_price,
                            original_price=orig_price,
                            currency_code=normalized["currency_code"],
                            discount_percentage=disc_pct,
                            availability_status="AVAILABLE" if normalized.get("is_available", True) else "UNAVAILABLE",
                            product_url=normalized["store_url"],
                            observed_at=now,
                            verification_status="VERIFIED",
                        )
                        session.add(new_obs)
                        ingestion_log.records_created += 1
                        total_created += 1

                        # Price Drop & Target Price Alert Detection
                        # If price dropped compared to previous observation, or if a discount is present
                        price_dropped = prev_obs is not None and curr_price < prev_obs.current_price

                        # Check active player alerts for this product and region
                        alert_stmt = (
                            select(PriceAlert)
                            .where(
                                PriceAlert.product_id == product.id,
                                PriceAlert.region_id == db_region.id,
                                PriceAlert.is_active.is_(True),
                                PriceAlert.target_price >= curr_price,
                            )
                        )
                        alert_res = await session.execute(alert_stmt)
                        active_alerts = alert_res.scalars().all()

                        for alert in active_alerts:
                            # Prevent duplicate alert events for same product, store, price within 24 hours
                            recent_evt_stmt = (
                                select(PriceAlertEvent)
                                .where(
                                    PriceAlertEvent.alert_id == alert.id,
                                    PriceAlertEvent.observed_price == curr_price,
                                    PriceAlertEvent.triggered_at >= (now - timedelta(hours=24)),
                                )
                            )
                            recent_evt_res = await session.execute(recent_evt_stmt)
                            if recent_evt_res.scalar_one_or_none():
                                continue

                            # Create PriceAlertEvent
                            alert_event = PriceAlertEvent(
                                alert_id=alert.id,
                                observed_price=curr_price,
                                currency_code=db_region.currency_code,
                                delivery_status="DELIVERED",
                                triggered_at=now,
                            )
                            session.add(alert_event)
                            alerts_triggered += 1

                            # Dispatch In-App / Multi-Channel Notification
                            notif_title = f"Price Alert: {product.name} Reached Your Target Price!"
                            notif_msg = (
                                f"Great news! {product.name} is now available at {db_store.store_name} "
                                f"for {db_region.currency_symbol}{curr_price} (your target was {db_region.currency_symbol}{alert.target_price})."
                            )
                            await create_player_notification(
                                db=session,
                                user_id=alert.player_id,
                                title=notif_title,
                                message=notif_msg,
                                notification_type="PRICE_DROP",
                                reference_id=str(product.id),
                                reference_url=f"/price-deals/{product.slug}",
                                priority="HIGH",
                            )

                src_status.last_successful_at = now
                src_status.last_error = None
                src_status.health_status = "HEALTHY"
                ingestion_log.status = "SUCCESS"

            except Exception as store_err:
                logger.error(f"Error refreshing prices for {store_name}: {store_err}")
                src_status.last_error = str(store_err)
                src_status.health_status = "DEGRADED"
                ingestion_log.status = "FAILED"
                ingestion_log.records_failed += 1
                total_failed += 1

            ingestion_log.completed_at = datetime.now(timezone.utc)
            await session.commit()

        return {
            "retrieved": total_retrieved,
            "created": total_created,
            "skipped": total_skipped,
            "failed": total_failed,
            "alerts_triggered": alerts_triggered,
            "timestamp": now.isoformat(),
        }

    @staticmethod
    async def check_stale_prices(
        session: AsyncSession,
        max_age_hours: int = 48,
    ) -> Dict[str, Any]:
        """Identifies price observations that have not been refreshed within the threshold."""
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(hours=max_age_hours)

        stmt = (
            select(PriceObservation)
            .where(PriceObservation.observed_at < threshold)
            .order_by(PriceObservation.observed_at.asc())
        )
        res = await session.execute(stmt)
        stale_records = res.scalars().all()

        return {
            "total_stale_observations": len(stale_records),
            "threshold_hours": max_age_hours,
            "evaluated_at": now.isoformat(),
        }
