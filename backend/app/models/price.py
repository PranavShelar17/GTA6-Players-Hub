import uuid
from decimal import Decimal
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import GUID


class PriceProduct(Base):
    __tablename__ = "price_products"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    platform = Column(String(50), nullable=False, index=True)  # PLAYSTATION_5, XBOX_SERIES, PC
    edition = Column(String(50), nullable=False, index=True)  # STANDARD, SPECIAL, ULTIMATE
    official_product_url = Column(String(512), nullable=True)
    image_url = Column(String(512), nullable=True)
    release_status = Column(String(50), nullable=False, default="ANNOUNCED")  # ANNOUNCED, PREORDER_LIVE, RELEASED, UNCONFIRMED
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    observations = relationship("PriceObservation", back_populates="product", cascade="all, delete-orphan")
    alerts = relationship("PriceAlert", back_populates="product", cascade="all, delete-orphan")
    wishlist_items = relationship("PriceWishlist", back_populates="product", cascade="all, delete-orphan")


class PriceRegion(Base):
    __tablename__ = "price_regions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    region_name = Column(String(100), nullable=False)
    country_code = Column(String(3), nullable=False, unique=True, index=True)  # IND, USA, GBR, EUR, ARE
    currency_code = Column(String(3), nullable=False)  # INR, USD, GBP, EUR, AED
    currency_symbol = Column(String(10), nullable=False)  # ₹, $, £, €, AED
    tax_inclusive = Column(Boolean, nullable=False, default=True)
    exchange_rate_to_inr = Column(Numeric(12, 4), nullable=False, default=1.0000)
    exchange_rate_to_usd = Column(Numeric(12, 4), nullable=False, default=1.0000)
    rates_last_updated = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    observations = relationship("PriceObservation", back_populates="region")
    alerts = relationship("PriceAlert", back_populates="region")


class PriceStore(Base):
    __tablename__ = "price_stores"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    store_name = Column(String(100), nullable=False, unique=True)
    website_url = Column(String(512), nullable=False)
    store_type = Column(String(50), nullable=False, default="OFFICIAL_STORE")  # FIRST_PARTY, OFFICIAL_STORE, AUTHORISED_RETAILER
    seller_authorisation_status = Column(String(50), nullable=False, default="AUTHORISED")  # FIRST_PARTY, AUTHORISED, COMMUNITY_REPORTED
    source_type = Column(String(50), nullable=False, default="DIRECT")  # API, FEED, CURATED
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    observations = relationship("PriceObservation", back_populates="store")


class PriceObservation(Base):
    __tablename__ = "price_observations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    product_id = Column(GUID(), ForeignKey("price_products.id", ondelete="CASCADE"), nullable=False, index=True)
    region_id = Column(GUID(), ForeignKey("price_regions.id", ondelete="CASCADE"), nullable=False, index=True)
    store_id = Column(GUID(), ForeignKey("price_stores.id", ondelete="CASCADE"), nullable=False, index=True)
    current_price = Column(Numeric(10, 2), nullable=False)
    original_price = Column(Numeric(10, 2), nullable=True)
    currency_code = Column(String(3), nullable=False)
    discount_percentage = Column(Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    availability_status = Column(String(50), nullable=False, default="PREORDER_AVAILABLE")  # AVAILABLE, PREORDER_AVAILABLE, OUT_OF_STOCK, UNAVAILABLE
    verification_status = Column(String(50), nullable=False, default="VERIFIED", index=True)  # VERIFIED, STALE, UNAVAILABLE, UNVERIFIED
    product_url = Column(String(512), nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    product = relationship("PriceProduct", back_populates="observations")
    region = relationship("PriceRegion", back_populates="observations")
    store = relationship("PriceStore", back_populates="observations")

    __table_args__ = (
        Index("ix_price_obs_product_region_date", "product_id", "region_id", "observed_at"),
    )


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    player_id = Column(GUID(), nullable=False, index=True)
    product_id = Column(GUID(), ForeignKey("price_products.id", ondelete="CASCADE"), nullable=False, index=True)
    target_price = Column(Numeric(10, 2), nullable=False)
    currency_code = Column(String(3), nullable=False)
    region_id = Column(GUID(), ForeignKey("price_regions.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    product = relationship("PriceProduct", back_populates="alerts")
    region = relationship("PriceRegion", back_populates="alerts")
    events = relationship("PriceAlertEvent", back_populates="alert", cascade="all, delete-orphan")


class PriceAlertEvent(Base):
    __tablename__ = "price_alert_events"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    alert_id = Column(GUID(), ForeignKey("price_alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    observed_price = Column(Numeric(10, 2), nullable=False)
    currency_code = Column(String(3), nullable=False)
    delivery_status = Column(String(50), nullable=False, default="RECORDED")  # RECORDED, PENDING_DELIVERY, DELIVERED, DISMISSED
    triggered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    alert = relationship("PriceAlert", back_populates="events")


class PriceWishlist(Base):
    __tablename__ = "price_wishlist"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    player_id = Column(GUID(), nullable=False, index=True)
    product_id = Column(GUID(), ForeignKey("price_products.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    product = relationship("PriceProduct", back_populates="wishlist_items")

    __table_args__ = (
        UniqueConstraint("player_id", "product_id", name="uq_player_wishlist_product"),
    )


class PriceSource(Base):
    __tablename__ = "price_sources"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    source_name = Column(String(100), nullable=False, unique=True)
    source_type = Column(String(50), nullable=False, default="OFFICIAL_API")  # OFFICIAL_STORE, FIRST_PARTY, AFFILIATE_FEED, MANUAL_CURATED
    source_url = Column(String(512), nullable=False)
    integration_method = Column(String(50), nullable=False, default="API")  # API, FEED, CURATED
    is_enabled = Column(Boolean, nullable=False, default=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
