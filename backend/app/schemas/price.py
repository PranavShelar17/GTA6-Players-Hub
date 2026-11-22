import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


# --- Region & Store Schemas ---

class PriceRegionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    region_name: str
    country_code: str
    currency_code: str
    currency_symbol: str
    tax_inclusive: bool
    exchange_rate_to_inr: Decimal
    exchange_rate_to_usd: Decimal
    rates_last_updated: datetime


class PriceStoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    store_name: str
    website_url: str
    store_type: str
    seller_authorisation_status: str
    source_type: str


# --- Product & Observation Schemas ---

class ConvertedPriceInfo(BaseModel):
    amount_inr: Decimal
    exchange_rate_used: Decimal
    rate_timestamp: datetime
    is_converted_estimate: bool = True
    disclaimer: str = "Converted estimate based on verified reference forex rates. Local retail pricing may vary."


class PriceObservationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    store_id: uuid.UUID
    store_name: str
    store_type: str
    seller_authorisation_status: str
    region_id: uuid.UUID
    country_code: str
    current_price: Decimal
    original_price: Optional[Decimal] = None
    currency_code: str
    currency_symbol: str
    discount_percentage: Decimal
    availability_status: str
    verification_status: str
    product_url: str
    observed_at: datetime
    tax_inclusive: bool
    converted_inr: Optional[ConvertedPriceInfo] = None


class PriceProductListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    platform: str
    edition: str
    image_url: Optional[str] = None
    release_status: str
    lowest_verified_price: Optional[Decimal] = None
    currency_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    available_stores_count: int = 0
    pc_pricing_available: bool = True
    pc_status_notice: Optional[str] = None


class PriceComparisonOffer(BaseModel):
    store_id: uuid.UUID
    store_name: str
    store_type: str
    seller_authorisation_status: str
    current_price: Decimal
    original_price: Optional[Decimal] = None
    currency_code: str
    currency_symbol: str
    discount_percentage: Decimal
    availability_status: str
    verification_status: str
    is_best_price: bool = False
    product_url: str
    observed_at: datetime
    tax_inclusive: bool
    converted_inr: Optional[ConvertedPriceInfo] = None


class PriceComparisonResponse(BaseModel):
    product_id: uuid.UUID
    product_name: str
    slug: str
    platform: str
    edition: str
    region: PriceRegionResponse
    offers: List[PriceComparisonOffer]
    best_offer: Optional[PriceComparisonOffer] = None
    pc_pricing_available: bool = True
    pc_status_notice: Optional[str] = None
    tax_disclosure: str


class DealItemResponse(BaseModel):
    observation_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    slug: str
    platform: str
    edition: str
    image_url: Optional[str] = None
    store_name: str
    country_code: str
    currency_code: str
    currency_symbol: str
    current_price: Decimal
    original_price: Decimal
    discount_percentage: Decimal
    verification_status: str
    product_url: str
    observed_at: datetime
    tax_inclusive: bool


class PriceHistoryPoint(BaseModel):
    observed_at: datetime
    price: Decimal
    currency_code: str
    currency_symbol: str
    store_name: str
    verification_status: str


class PriceHistoryResponse(BaseModel):
    product_id: uuid.UUID
    product_name: str
    slug: str
    platform: str
    edition: str
    region: PriceRegionResponse
    current_verified_price: Optional[Decimal] = None
    historical_lowest_price: Optional[Decimal] = None
    historical_highest_price: Optional[Decimal] = None
    tracking_period_start: Optional[datetime] = None
    tracking_period_end: Optional[datetime] = None
    total_observations: int
    data_points: List[PriceHistoryPoint]
    insufficient_data_notice: Optional[str] = None


class PriceProductDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    platform: str
    edition: str
    official_product_url: Optional[str] = None
    image_url: Optional[str] = None
    release_status: str
    pc_pricing_available: bool
    pc_status_notice: Optional[str] = None
    available_regions: List[PriceRegionResponse]
    current_observations: List[PriceObservationItem]
    lowest_verified_price: Optional[Decimal] = None
    historical_lowest_price: Optional[Decimal] = None
    historical_highest_price: Optional[Decimal] = None


# --- Wishlist Schemas ---

class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    slug: str
    platform: str
    edition: str
    image_url: Optional[str] = None
    lowest_verified_price: Optional[Decimal] = None
    currency_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    added_at: datetime


class WishlistToggleResponse(BaseModel):
    product_id: uuid.UUID
    is_wishlisted: bool
    message: str


# --- Price Alert Schemas ---

class PriceAlertCreateRequest(BaseModel):
    product_id: uuid.UUID
    target_price: Decimal = Field(..., gt=0, description="Target threshold price must be greater than zero")
    currency_code: str = Field(..., min_length=3, max_length=3)
    region_id: uuid.UUID

    @field_validator("currency_code")
    @classmethod
    def uppercase_currency(cls, v: str) -> str:
        return v.upper()


class PriceAlertUpdateRequest(BaseModel):
    target_price: Optional[Decimal] = Field(None, gt=0)
    is_active: Optional[bool] = None


class PriceAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_slug: str
    platform: str
    edition: str
    target_price: Decimal
    currency_code: str
    region_id: uuid.UUID
    region_country_code: str
    is_active: bool
    last_triggered_at: Optional[datetime] = None
    current_verified_price: Optional[Decimal] = None
    is_target_met: bool = False
    created_at: datetime
    updated_at: datetime


class PriceAlertEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    alert_id: uuid.UUID
    observed_price: Decimal
    currency_code: str
    delivery_status: str
    triggered_at: datetime


# --- Stats Schema ---

class PriceStatsResponse(BaseModel):
    total_products: int
    total_observations: int
    total_verified_observations: int
    total_deals: int
    supported_regions: int
    supported_stores: int
    last_verified_at: Optional[datetime] = None
