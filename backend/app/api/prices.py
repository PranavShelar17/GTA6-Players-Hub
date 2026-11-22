import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.logging import logger
from app.core.security import CurrentUser, get_current_user, get_optional_current_user
from app.models.price import (
    PriceAlert,
    PriceAlertEvent,
    PriceObservation,
    PriceProduct,
    PriceRegion,
    PriceSource,
    PriceStore,
    PriceWishlist,
)
from app.schemas.envelope import ApiResponse
from app.schemas.price import (
    ConvertedPriceInfo,
    DealItemResponse,
    PriceAlertCreateRequest,
    PriceAlertResponse,
    PriceAlertUpdateRequest,
    PriceComparisonOffer,
    PriceComparisonResponse,
    PriceHistoryPoint,
    PriceHistoryResponse,
    PriceObservationItem,
    PriceProductDetailResponse,
    PriceProductListItem,
    PriceRegionResponse,
    PriceStatsResponse,
    PriceStoreResponse,
    WishlistItemResponse,
    WishlistToggleResponse,
)
from app.services.price_service import (
    calculate_discount_percentage,
    check_verification_status,
    convert_currency_to_inr,
    evaluate_and_trigger_alerts,
)
from app.services.price_collector import seed_initial_price_data

router = APIRouter(prefix="/prices", tags=["Prices & Deals Tracker"])


def response_meta():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


async def ensure_prices_seeded(db: AsyncSession):
    """Ensures baseline price catalog and observations are seeded on first query."""
    count_stmt = select(func.count(PriceProduct.id))
    res = await db.execute(count_stmt)
    count = res.scalar() or 0
    if count == 0:
        await seed_initial_price_data(db)


# --- Reference Endpoints: Regions & Stores ---

@router.get("/regions", response_model=ApiResponse[List[PriceRegionResponse]])
async def get_price_regions(db: AsyncSession = Depends(get_db)):
    """Retrieves all supported regions, currencies, and verified exchange rates."""
    await ensure_prices_seeded(db)
    stmt = select(PriceRegion).where(PriceRegion.is_active.is_(True)).order_by(PriceRegion.country_code)
    res = await db.execute(stmt)
    regions = res.scalars().all()
    return ApiResponse(
        success=True,
        data=[PriceRegionResponse.model_validate(r) for r in regions],
        meta=response_meta()
    )


@router.get("/stores", response_model=ApiResponse[List[PriceStoreResponse]])
async def get_price_stores(db: AsyncSession = Depends(get_db)):
    """Retrieves verified stores, first-party marketplaces, and authorized retailers."""
    await ensure_prices_seeded(db)
    stmt = select(PriceStore).where(PriceStore.is_active.is_(True)).order_by(PriceStore.store_name)
    res = await db.execute(stmt)
    stores = res.scalars().all()
    return ApiResponse(
        success=True,
        data=[PriceStoreResponse.model_validate(s) for s in stores],
        meta=response_meta()
    )


# --- Products Catalog ---

@router.get("/products", response_model=ApiResponse[List[PriceProductListItem]])
async def list_price_products(
    platform: Optional[str] = Query(None, description="PLAYSTATION_5, XBOX_SERIES, PC"),
    edition: Optional[str] = Query(None, description="STANDARD, SPECIAL, ULTIMATE"),
    search: Optional[str] = Query(None, description="Search by product name"),
    country_code: str = Query("USA", description="Region code for pricing context (default: USA)"),
    db: AsyncSession = Depends(get_db)
):
    """Lists tracked game editions with lowest verified pricing in the chosen region."""
    await ensure_prices_seeded(db)
    stmt = select(PriceProduct)

    if platform:
        stmt = stmt.where(PriceProduct.platform == platform.upper())
    if edition:
        stmt = stmt.where(PriceProduct.edition == edition.upper())
    if search:
        stmt = stmt.where(PriceProduct.name.ilike(f"%{search}%"))

    stmt = stmt.order_by(PriceProduct.platform, PriceProduct.name)
    res = await db.execute(stmt)
    products = res.scalars().all()

    # Get target region
    reg_stmt = select(PriceRegion).where(PriceRegion.country_code == country_code.upper())
    reg_res = await db.execute(reg_stmt)
    region = reg_res.scalar_one_or_none()

    items: List[PriceProductListItem] = []
    for p in products:
        lowest_price = None
        curr_code = None
        curr_sym = None
        stores_count = 0
        pc_pricing_available = p.platform != "PC"
        pc_status_notice = None

        if p.platform == "PC":
            pc_pricing_available = False
            pc_status_notice = "Official PC pricing is not currently available. Pre-orders have not opened."

        if region and pc_pricing_available:
            obs_stmt = select(PriceObservation).where(
                PriceObservation.product_id == p.id,
                PriceObservation.region_id == region.id,
                PriceObservation.verification_status.in_(["VERIFIED", "STALE"])
            ).order_by(PriceObservation.current_price.asc())
            obs_res = await db.execute(obs_stmt)
            observations = obs_res.scalars().all()
            if observations:
                lowest_price = observations[0].current_price
                curr_code = region.currency_code
                curr_sym = region.currency_symbol
                stores_count = len(observations)

        items.append(
            PriceProductListItem(
                id=p.id,
                name=p.name,
                slug=p.slug,
                description=p.description,
                platform=p.platform,
                edition=p.edition,
                image_url=p.image_url,
                release_status=p.release_status,
                lowest_verified_price=lowest_price,
                currency_code=curr_code,
                currency_symbol=curr_sym,
                available_stores_count=stores_count,
                pc_pricing_available=pc_pricing_available,
                pc_status_notice=pc_status_notice
            )
        )

    return ApiResponse(success=True, data=items, meta=response_meta())


# --- Deals Section ---

@router.get("/deals", response_model=ApiResponse[List[DealItemResponse]])
async def get_price_deals(
    platform: Optional[str] = Query(None),
    country_code: Optional[str] = Query(None),
    min_discount: Decimal = Query(Decimal("0.01"), description="Minimum discount percentage"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves genuine, verified discounts across authorized retailers and stores."""
    await ensure_prices_seeded(db)
    stmt = (
        select(PriceObservation)
        .options(
            selectinload(PriceObservation.product),
            selectinload(PriceObservation.region),
            selectinload(PriceObservation.store),
        )
        .where(
            PriceObservation.verification_status.in_(["VERIFIED", "STALE"]),
            PriceObservation.discount_percentage >= min_discount,
            PriceObservation.original_price.isnot(None)
        )
    )

    if country_code:
        stmt = stmt.join(PriceRegion).where(PriceRegion.country_code == country_code.upper())
    if platform:
        stmt = stmt.join(PriceProduct).where(PriceProduct.platform == platform.upper())

    stmt = stmt.order_by(desc(PriceObservation.discount_percentage), PriceObservation.current_price.asc()).limit(limit)
    res = await db.execute(stmt)
    observations = res.scalars().all()

    deals: List[DealItemResponse] = []
    for obs in observations:
        deals.append(
            DealItemResponse(
                observation_id=obs.id,
                product_id=obs.product.id,
                product_name=obs.product.name,
                slug=obs.product.slug,
                platform=obs.product.platform,
                edition=obs.product.edition,
                image_url=obs.product.image_url,
                store_name=obs.store.store_name,
                country_code=obs.region.country_code,
                currency_code=obs.currency_code,
                currency_symbol=obs.region.currency_symbol,
                current_price=obs.current_price,
                original_price=obs.original_price or obs.current_price,
                discount_percentage=obs.discount_percentage,
                verification_status=obs.verification_status,
                product_url=obs.product_url,
                observed_at=obs.observed_at,
                tax_inclusive=obs.region.tax_inclusive,
            )
        )

    return ApiResponse(success=True, data=deals, meta=response_meta())


# --- Price Comparison Endpoint ---

@router.get("/compare", response_model=ApiResponse[PriceComparisonResponse])
async def compare_prices(
    slug: str = Query(..., description="Product slug e.g. gta-6-standard-edition-ps5"),
    country_code: str = Query("IND", description="Target region code: IND, USA, GBR, EUR, ARE"),
    db: AsyncSession = Depends(get_db)
):
    """Comprehensive store price comparison for a specific product and region."""
    await ensure_prices_seeded(db)
    # 1. Fetch Product
    prod_stmt = select(PriceProduct).where(PriceProduct.slug == slug)
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with slug '{slug}' not found"
        )

    # 2. Fetch Region
    reg_stmt = select(PriceRegion).where(PriceRegion.country_code == country_code.upper())
    reg_res = await db.execute(reg_stmt)
    region = reg_res.scalar_one_or_none()
    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Region with country code '{country_code}' not found"
        )

    # 3. Check PC status
    if product.platform == "PC":
        tax_disclosure = "Official PC pricing has not been announced by Rockstar Games."
        return ApiResponse(
            success=True,
            data=PriceComparisonResponse(
                product_id=product.id,
                product_name=product.name,
                slug=product.slug,
                platform=product.platform,
                edition=product.edition,
                region=PriceRegionResponse.model_validate(region),
                offers=[],
                best_offer=None,
                pc_pricing_available=False,
                pc_status_notice="Official PC pricing is not currently available. Pre-orders have not opened.",
                tax_disclosure=tax_disclosure
            ),
            meta=response_meta()
        )

    # 4. Fetch Observations for this Product & Region
    obs_stmt = (
        select(PriceObservation)
        .options(selectinload(PriceObservation.store))
        .where(
            PriceObservation.product_id == product.id,
            PriceObservation.region_id == region.id,
            PriceObservation.verification_status.in_(["VERIFIED", "STALE"])
        )
        .order_by(PriceObservation.current_price.asc())
    )
    obs_res = await db.execute(obs_stmt)
    observations = obs_res.scalars().all()

    tax_disclosure = (
        f"Prices in {region.region_name} ({region.currency_code}) include all applicable sales taxes/VAT."
        if region.tax_inclusive
        else f"Prices in {region.region_name} ({region.currency_code}) exclude state/local sales tax, which is calculated at final checkout."
    )

    offers: List[PriceComparisonOffer] = []
    best_offer = None

    for idx, obs in enumerate(observations):
        is_best = (idx == 0)

        converted_info = None
        if region.currency_code != "INR":
            amt_inr, rate_used, rate_time = convert_currency_to_inr(obs.current_price, region)
            converted_info = ConvertedPriceInfo(
                amount_inr=amt_inr,
                exchange_rate_used=rate_used,
                rate_timestamp=rate_time,
                is_converted_estimate=True,
                disclaimer=f"Converted estimate from {region.currency_code} to INR at verified exchange rate {rate_used}. Local Indian store pricing may differ."
            )

        offer = PriceComparisonOffer(
            store_id=obs.store.id,
            store_name=obs.store.store_name,
            store_type=obs.store.store_type,
            seller_authorisation_status=obs.store.seller_authorisation_status,
            current_price=obs.current_price,
            original_price=obs.original_price,
            currency_code=obs.currency_code,
            currency_symbol=region.currency_symbol,
            discount_percentage=obs.discount_percentage,
            availability_status=obs.availability_status,
            verification_status=obs.verification_status,
            is_best_price=is_best,
            product_url=obs.product_url,
            observed_at=obs.observed_at,
            tax_inclusive=region.tax_inclusive,
            converted_inr=converted_info,
        )
        offers.append(offer)
        if is_best:
            best_offer = offer

    return ApiResponse(
        success=True,
        data=PriceComparisonResponse(
            product_id=product.id,
            product_name=product.name,
            slug=product.slug,
            platform=product.platform,
            edition=product.edition,
            region=PriceRegionResponse.model_validate(region),
            offers=offers,
            best_offer=best_offer,
            pc_pricing_available=True,
            pc_status_notice=None,
            tax_disclosure=tax_disclosure
        ),
        meta=response_meta()
    )


# --- Price History Endpoint ---

@router.get("/products/{slug}/history", response_model=ApiResponse[PriceHistoryResponse])
async def get_price_history(
    slug: str,
    country_code: str = Query("USA", description="Region code for history tracking"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves verified historical price observations and statistical bounds over time."""
    await ensure_prices_seeded(db)
    # 1. Product
    prod_stmt = select(PriceProduct).where(PriceProduct.slug == slug)
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{slug}' not found")

    # 2. Region
    reg_stmt = select(PriceRegion).where(PriceRegion.country_code == country_code.upper())
    reg_res = await db.execute(reg_stmt)
    region = reg_res.scalar_one_or_none()
    if not region:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Region '{country_code}' not found")

    # 3. Observations ordered chronologically
    obs_stmt = (
        select(PriceObservation)
        .options(selectinload(PriceObservation.store))
        .where(
            PriceObservation.product_id == product.id,
            PriceObservation.region_id == region.id,
            PriceObservation.verification_status.in_(["VERIFIED", "STALE"])
        )
        .order_by(PriceObservation.observed_at.asc())
    )
    obs_res = await db.execute(obs_stmt)
    observations = obs_res.scalars().all()

    if not observations:
        notice = "Insufficient verified historical observations recorded for this region and platform."
        return ApiResponse(
            success=True,
            data=PriceHistoryResponse(
                product_id=product.id,
                product_name=product.name,
                slug=product.slug,
                platform=product.platform,
                edition=product.edition,
                region=PriceRegionResponse.model_validate(region),
                current_verified_price=None,
                historical_lowest_price=None,
                historical_highest_price=None,
                tracking_period_start=None,
                tracking_period_end=None,
                total_observations=0,
                data_points=[],
                insufficient_data_notice=notice
            ),
            meta=response_meta()
        )

    prices = [obs.current_price for obs in observations]
    lowest_p = min(prices)
    highest_p = max(prices)
    current_p = observations[-1].current_price

    data_points = [
        PriceHistoryPoint(
            observed_at=obs.observed_at,
            price=obs.current_price,
            currency_code=obs.currency_code,
            currency_symbol=region.currency_symbol,
            store_name=obs.store.store_name,
            verification_status=obs.verification_status,
        )
        for obs in observations
    ]

    return ApiResponse(
        success=True,
        data=PriceHistoryResponse(
            product_id=product.id,
            product_name=product.name,
            slug=product.slug,
            platform=product.platform,
            edition=product.edition,
            region=PriceRegionResponse.model_validate(region),
            current_verified_price=current_p,
            historical_lowest_price=lowest_p,
            historical_highest_price=highest_p,
            tracking_period_start=observations[0].observed_at,
            tracking_period_end=observations[-1].observed_at,
            total_observations=len(observations),
            data_points=data_points,
            insufficient_data_notice=None if len(observations) >= 2 else "Limited data points recorded during early pre-order tracking window."
        ),
        meta=response_meta()
    )


# --- Product Detail Endpoint ---

@router.get("/products/{slug}", response_model=ApiResponse[PriceProductDetailResponse])
async def get_price_product_detail(
    slug: str,
    country_code: str = Query("USA"),
    db: AsyncSession = Depends(get_db)
):
    """Detailed product overview, region metrics, and current store offers."""
    await ensure_prices_seeded(db)
    prod_stmt = select(PriceProduct).where(PriceProduct.slug == slug)
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{slug}' not found")

    reg_stmt = select(PriceRegion).where(PriceRegion.is_active.is_(True)).order_by(PriceRegion.country_code)
    reg_res = await db.execute(reg_stmt)
    regions = reg_res.scalars().all()

    # Get target region
    current_region = next((r for r in regions if r.country_code == country_code.upper()), regions[0] if regions else None)

    current_observations: List[PriceObservationItem] = []
    lowest_price = None
    historical_lowest = None
    historical_highest = None

    if current_region and product.platform != "PC":
        obs_stmt = (
            select(PriceObservation)
            .options(selectinload(PriceObservation.store), selectinload(PriceObservation.region))
            .where(
                PriceObservation.product_id == product.id,
                PriceObservation.region_id == current_region.id,
                PriceObservation.verification_status.in_(["VERIFIED", "STALE"])
            )
            .order_by(PriceObservation.current_price.asc())
        )
        obs_res = await db.execute(obs_stmt)
        obs_list = obs_res.scalars().all()

        if obs_list:
            lowest_price = obs_list[0].current_price
            all_prices = [o.current_price for o in obs_list]
            historical_lowest = min(all_prices)
            historical_highest = max(all_prices)

            for o in obs_list:
                converted_info = None
                if o.currency_code != "INR":
                    amt_inr, rate_used, rate_time = convert_currency_to_inr(o.current_price, o.region)
                    converted_info = ConvertedPriceInfo(
                        amount_inr=amt_inr,
                        exchange_rate_used=rate_used,
                        rate_timestamp=rate_time,
                        is_converted_estimate=True
                    )

                current_observations.append(
                    PriceObservationItem(
                        id=o.id,
                        product_id=o.product_id,
                        store_id=o.store_id,
                        store_name=o.store.store_name,
                        store_type=o.store.store_type,
                        seller_authorisation_status=o.store.seller_authorisation_status,
                        region_id=o.region_id,
                        country_code=o.region.country_code,
                        current_price=o.current_price,
                        original_price=o.original_price,
                        currency_code=o.currency_code,
                        currency_symbol=o.region.currency_symbol,
                        discount_percentage=o.discount_percentage,
                        availability_status=o.availability_status,
                        verification_status=o.verification_status,
                        product_url=o.product_url,
                        observed_at=o.observed_at,
                        tax_inclusive=o.region.tax_inclusive,
                        converted_inr=converted_info,
                    )
                )

    pc_available = product.platform != "PC"
    pc_notice = None if pc_available else "Official PC pricing is not currently available. Rockstar Games has not announced PC pre-order availability."

    return ApiResponse(
        success=True,
        data=PriceProductDetailResponse(
            id=product.id,
            name=product.name,
            slug=product.slug,
            description=product.description,
            platform=product.platform,
            edition=product.edition,
            official_product_url=product.official_product_url,
            image_url=product.image_url,
            release_status=product.release_status,
            pc_pricing_available=pc_available,
            pc_status_notice=pc_notice,
            available_regions=[PriceRegionResponse.model_validate(r) for r in regions],
            current_observations=current_observations,
            lowest_verified_price=lowest_price,
            historical_lowest_price=historical_lowest,
            historical_highest_price=historical_highest,
        ),
        meta=response_meta()
    )


# --- Wishlist Endpoints ---

@router.get("/wishlist", response_model=ApiResponse[List[WishlistItemResponse]])
async def get_player_wishlist(
    current_user: CurrentUser = Depends(get_current_user),
    country_code: str = Query("USA"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves the authenticated player's personal saved wishlist."""
    await ensure_prices_seeded(db)
    stmt = (
        select(PriceWishlist)
        .options(selectinload(PriceWishlist.product))
        .where(PriceWishlist.player_id == current_user.id)
        .order_by(PriceWishlist.created_at.desc())
    )
    res = await db.execute(stmt)
    wishlist_items = res.scalars().all()

    reg_stmt = select(PriceRegion).where(PriceRegion.country_code == country_code.upper())
    reg_res = await db.execute(reg_stmt)
    region = reg_res.scalar_one_or_none()

    results: List[WishlistItemResponse] = []
    for item in wishlist_items:
        prod = item.product
        lowest_price = None
        curr_code = None
        curr_sym = None

        if region and prod.platform != "PC":
            obs_stmt = select(PriceObservation).where(
                PriceObservation.product_id == prod.id,
                PriceObservation.region_id == region.id,
                PriceObservation.verification_status.in_(["VERIFIED", "STALE"])
            ).order_by(PriceObservation.current_price.asc())
            obs_res = await db.execute(obs_stmt)
            best_obs = obs_res.scalars().first()
            if best_obs:
                lowest_price = best_obs.current_price
                curr_code = region.currency_code
                curr_sym = region.currency_symbol

        results.append(
            WishlistItemResponse(
                id=item.id,
                product_id=prod.id,
                product_name=prod.name,
                slug=prod.slug,
                platform=prod.platform,
                edition=prod.edition,
                image_url=prod.image_url,
                lowest_verified_price=lowest_price,
                currency_code=curr_code,
                currency_symbol=curr_sym,
                added_at=item.created_at,
            )
        )

    return ApiResponse(success=True, data=results, meta=response_meta())


@router.post("/wishlist/{product_id}", response_model=ApiResponse[WishlistToggleResponse])
async def add_to_wishlist(
    product_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Adds a game edition to the authenticated player's wishlist."""
    await ensure_prices_seeded(db)
    # Verify product exists
    prod_stmt = select(PriceProduct).where(PriceProduct.id == product_id)
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Check if already wishlisted
    check_stmt = select(PriceWishlist).where(
        PriceWishlist.player_id == current_user.id,
        PriceWishlist.product_id == product_id
    )
    check_res = await db.execute(check_stmt)
    existing = check_res.scalar_one_or_none()

    if existing:
        return ApiResponse(
            success=True,
            data=WishlistToggleResponse(
                product_id=product_id,
                is_wishlisted=True,
                message="Product is already in your wishlist."
            ),
            meta=response_meta()
        )

    wishlist_item = PriceWishlist(
        id=uuid.uuid4(),
        player_id=current_user.id,
        product_id=product_id
    )
    db.add(wishlist_item)
    await db.commit()

    return ApiResponse(
        success=True,
        data=WishlistToggleResponse(
            product_id=product_id,
            is_wishlisted=True,
            message="Product added to your wishlist."
        ),
        meta=response_meta()
    )


@router.delete("/wishlist/{product_id}", response_model=ApiResponse[WishlistToggleResponse])
async def remove_from_wishlist(
    product_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Removes a game edition from the authenticated player's wishlist."""
    stmt = select(PriceWishlist).where(
        PriceWishlist.player_id == current_user.id,
        PriceWishlist.product_id == product_id
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wishlist item not found")

    await db.delete(item)
    await db.commit()

    return ApiResponse(
        success=True,
        data=WishlistToggleResponse(
            product_id=product_id,
            is_wishlisted=False,
            message="Product removed from your wishlist."
        ),
        meta=response_meta()
    )


# --- Price Alerts Endpoints ---

@router.get("/alerts", response_model=ApiResponse[List[PriceAlertResponse]])
async def get_player_price_alerts(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all target price alerts configured by the authenticated player."""
    await ensure_prices_seeded(db)
    stmt = (
        select(PriceAlert)
        .options(selectinload(PriceAlert.product), selectinload(PriceAlert.region))
        .where(PriceAlert.player_id == current_user.id)
        .order_by(PriceAlert.created_at.desc())
    )
    res = await db.execute(stmt)
    alerts = res.scalars().all()

    alert_responses: List[PriceAlertResponse] = []
    for a in alerts:
        # Check current lowest verified price for target met indicator
        obs_stmt = select(PriceObservation).where(
            PriceObservation.product_id == a.product_id,
            PriceObservation.region_id == a.region_id,
            PriceObservation.verification_status.in_(["VERIFIED", "STALE"])
        ).order_by(PriceObservation.current_price.asc())
        obs_res = await db.execute(obs_stmt)
        best_obs = obs_res.scalars().first()

        current_verified = best_obs.current_price if best_obs else None
        target_met = (current_verified is not None) and (current_verified <= a.target_price)

        alert_responses.append(
            PriceAlertResponse(
                id=a.id,
                product_id=a.product.id,
                product_name=a.product.name,
                product_slug=a.product.slug,
                platform=a.product.platform,
                edition=a.product.edition,
                target_price=a.target_price,
                currency_code=a.currency_code,
                region_id=a.region_id,
                region_country_code=a.region.country_code,
                is_active=a.is_active,
                last_triggered_at=a.last_triggered_at,
                current_verified_price=current_verified,
                is_target_met=target_met,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
        )

    return ApiResponse(success=True, data=alert_responses, meta=response_meta())


@router.post("/alerts", response_model=ApiResponse[PriceAlertResponse])
async def create_price_alert(
    payload: PriceAlertCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new target price alert for a product and region."""
    await ensure_prices_seeded(db)
    # Verify product
    prod_stmt = select(PriceProduct).where(PriceProduct.id == payload.product_id)
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Verify region
    reg_stmt = select(PriceRegion).where(PriceRegion.id == payload.region_id)
    reg_res = await db.execute(reg_stmt)
    region = reg_res.scalar_one_or_none()
    if not region:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Region not found")

    # Validate target price positive
    if payload.target_price <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target price must be greater than zero."
        )

    alert = PriceAlert(
        id=uuid.uuid4(),
        player_id=current_user.id,
        product_id=payload.product_id,
        target_price=payload.target_price,
        currency_code=payload.currency_code,
        region_id=payload.region_id,
        is_active=True
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    # Check if target is already met right now
    obs_stmt = select(PriceObservation).where(
        PriceObservation.product_id == alert.product_id,
        PriceObservation.region_id == alert.region_id,
        PriceObservation.verification_status.in_(["VERIFIED", "STALE"])
    ).order_by(PriceObservation.current_price.asc())
    obs_res = await db.execute(obs_stmt)
    best_obs = obs_res.scalars().first()

    current_verified = best_obs.current_price if best_obs else None
    target_met = (current_verified is not None) and (current_verified <= alert.target_price)

    return ApiResponse(
        success=True,
        data=PriceAlertResponse(
            id=alert.id,
            product_id=product.id,
            product_name=product.name,
            product_slug=product.slug,
            platform=product.platform,
            edition=product.edition,
            target_price=alert.target_price,
            currency_code=alert.currency_code,
            region_id=region.id,
            region_country_code=region.country_code,
            is_active=alert.is_active,
            last_triggered_at=alert.last_triggered_at,
            current_verified_price=current_verified,
            is_target_met=target_met,
            created_at=alert.created_at,
            updated_at=alert.updated_at,
        ),
        meta=response_meta()
    )


@router.patch("/alerts/{alert_id}", response_model=ApiResponse[PriceAlertResponse])
async def update_price_alert(
    alert_id: uuid.UUID,
    payload: PriceAlertUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates an existing price alert (e.g., target price threshold or active status)."""
    stmt = (
        select(PriceAlert)
        .options(selectinload(PriceAlert.product), selectinload(PriceAlert.region))
        .where(PriceAlert.id == alert_id, PriceAlert.player_id == current_user.id)
    )
    res = await db.execute(stmt)
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price alert not found")

    if payload.target_price is not None:
        if payload.target_price <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Target price must be greater than zero."
            )
        alert.target_price = payload.target_price

    if payload.is_active is not None:
        alert.is_active = payload.is_active

    alert.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)

    # Current price check
    obs_stmt = select(PriceObservation).where(
        PriceObservation.product_id == alert.product_id,
        PriceObservation.region_id == alert.region_id,
        PriceObservation.verification_status.in_(["VERIFIED", "STALE"])
    ).order_by(PriceObservation.current_price.asc())
    obs_res = await db.execute(obs_stmt)
    best_obs = obs_res.scalars().first()

    current_verified = best_obs.current_price if best_obs else None
    target_met = (current_verified is not None) and (current_verified <= alert.target_price)

    return ApiResponse(
        success=True,
        data=PriceAlertResponse(
            id=alert.id,
            product_id=alert.product.id,
            product_name=alert.product.name,
            product_slug=alert.product.slug,
            platform=alert.product.platform,
            edition=alert.product.edition,
            target_price=alert.target_price,
            currency_code=alert.currency_code,
            region_id=alert.region.id,
            region_country_code=alert.region.country_code,
            is_active=alert.is_active,
            last_triggered_at=alert.last_triggered_at,
            current_verified_price=current_verified,
            is_target_met=target_met,
            created_at=alert.created_at,
            updated_at=alert.updated_at,
        ),
        meta=response_meta()
    )


@router.delete("/alerts/{alert_id}", response_model=ApiResponse[dict])
async def delete_price_alert(
    alert_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deletes a target price alert."""
    stmt = select(PriceAlert).where(
        PriceAlert.id == alert_id,
        PriceAlert.player_id == current_user.id
    )
    res = await db.execute(stmt)
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price alert not found")

    await db.delete(alert)
    await db.commit()

    return ApiResponse(
        success=True,
        data={"id": str(alert_id), "deleted": True},
        meta=response_meta()
    )


# --- Statistics Endpoint ---

@router.get("/stats", response_model=ApiResponse[PriceStatsResponse])
async def get_price_stats(db: AsyncSession = Depends(get_db)):
    """Retrieves overall platform price tracking statistics."""
    await ensure_prices_seeded(db)
    prod_count_stmt = select(func.count(PriceProduct.id))
    obs_count_stmt = select(func.count(PriceObservation.id))
    verif_obs_stmt = select(func.count(PriceObservation.id)).where(PriceObservation.verification_status == "VERIFIED")
    deals_count_stmt = select(func.count(PriceObservation.id)).where(
        PriceObservation.verification_status.in_(["VERIFIED", "STALE"]),
        PriceObservation.discount_percentage > Decimal("0.00")
    )
    reg_count_stmt = select(func.count(PriceRegion.id)).where(PriceRegion.is_active.is_(True))
    store_count_stmt = select(func.count(PriceStore.id)).where(PriceStore.is_active.is_(True))
    last_verif_stmt = select(func.max(PriceObservation.observed_at)).where(PriceObservation.verification_status == "VERIFIED")

    total_prods = (await db.execute(prod_count_stmt)).scalar() or 0
    total_obs = (await db.execute(obs_count_stmt)).scalar() or 0
    total_verif = (await db.execute(verif_obs_stmt)).scalar() or 0
    total_deals = (await db.execute(deals_count_stmt)).scalar() or 0
    total_regs = (await db.execute(reg_count_stmt)).scalar() or 0
    total_stores = (await db.execute(store_count_stmt)).scalar() or 0
    last_verif = (await db.execute(last_verif_stmt)).scalar()

    return ApiResponse(
        success=True,
        data=PriceStatsResponse(
            total_products=total_prods,
            total_observations=total_obs,
            total_verified_observations=total_verif,
            total_deals=total_deals,
            supported_regions=total_regs,
            supported_stores=total_stores,
            last_verified_at=last_verif,
        ),
        meta=response_meta()
    )
