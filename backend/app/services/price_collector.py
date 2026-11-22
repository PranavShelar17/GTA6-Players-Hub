import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.price import (
    PriceProduct,
    PriceRegion,
    PriceStore,
    PriceObservation,
    PriceSource,
)
from app.services.price_service import calculate_discount_percentage, check_verification_status
from app.core.logging import logger


APPROVED_REGIONS = [
    {
        "region_name": "India",
        "country_code": "IND",
        "currency_code": "INR",
        "currency_symbol": "₹",
        "tax_inclusive": True,
        "exchange_rate_to_inr": Decimal("1.0000"),
        "exchange_rate_to_usd": Decimal("0.0118"),
    },
    {
        "region_name": "United States",
        "country_code": "USA",
        "currency_code": "USD",
        "currency_symbol": "$",
        "tax_inclusive": False,
        "exchange_rate_to_inr": Decimal("84.5000"),
        "exchange_rate_to_usd": Decimal("1.0000"),
    },
    {
        "region_name": "United Kingdom",
        "country_code": "GBR",
        "currency_code": "GBP",
        "currency_symbol": "£",
        "tax_inclusive": True,
        "exchange_rate_to_inr": Decimal("106.8000"),
        "exchange_rate_to_usd": Decimal("1.2640"),
    },
    {
        "region_name": "Europe",
        "country_code": "EUR",
        "currency_code": "EUR",
        "currency_symbol": "€",
        "tax_inclusive": True,
        "exchange_rate_to_inr": Decimal("88.9000"),
        "exchange_rate_to_usd": Decimal("1.0520"),
    },
    {
        "region_name": "United Arab Emirates",
        "country_code": "ARE",
        "currency_code": "AED",
        "currency_symbol": "AED ",
        "tax_inclusive": True,
        "exchange_rate_to_inr": Decimal("23.0100"),
        "exchange_rate_to_usd": Decimal("0.2723"),
    },
]

APPROVED_STORES = [
    {
        "store_name": "PlayStation Store",
        "website_url": "https://store.playstation.com",
        "store_type": "FIRST_PARTY",
        "seller_authorisation_status": "FIRST_PARTY",
        "source_type": "API",
    },
    {
        "store_name": "Xbox Marketplace",
        "website_url": "https://www.xbox.com",
        "store_type": "FIRST_PARTY",
        "seller_authorisation_status": "FIRST_PARTY",
        "source_type": "API",
    },
    {
        "store_name": "Rockstar Games Store",
        "website_url": "https://store.rockstargames.com",
        "store_type": "FIRST_PARTY",
        "seller_authorisation_status": "FIRST_PARTY",
        "source_type": "CURATED",
    },
    {
        "store_name": "Amazon Gaming",
        "website_url": "https://www.amazon.com",
        "store_type": "AUTHORISED_RETAILER",
        "seller_authorisation_status": "AUTHORISED",
        "source_type": "FEED",
    },
    {
        "store_name": "Best Buy",
        "website_url": "https://www.bestbuy.com",
        "store_type": "AUTHORISED_RETAILER",
        "seller_authorisation_status": "AUTHORISED",
        "source_type": "FEED",
    },
]

APPROVED_SOURCES = [
    {
        "source_name": "PlayStation Direct API",
        "source_type": "FIRST_PARTY",
        "source_url": "https://store.playstation.com/api",
        "integration_method": "API",
        "is_enabled": True,
    },
    {
        "source_name": "Microsoft Storefront API",
        "source_type": "FIRST_PARTY",
        "source_url": "https://displaycatalog.mp.microsoft.com",
        "integration_method": "API",
        "is_enabled": True,
    },
    {
        "source_name": "Rockstar Web Feed",
        "source_type": "OFFICIAL_STORE",
        "source_url": "https://store.rockstargames.com/feed",
        "integration_method": "CURATED",
        "is_enabled": True,
    },
    {
        "source_name": "Authorised Retailers Syndicate",
        "source_type": "AFFILIATE_FEED",
        "source_url": "https://syndicate.gamingretailers.com/v1",
        "integration_method": "FEED",
        "is_enabled": True,
    },
]

APPROVED_PRODUCTS = [
    {
        "name": "Grand Theft Auto VI - Standard Edition (PlayStation 5)",
        "slug": "gta-6-standard-edition-ps5",
        "description": "Standard retail edition for PlayStation 5 including base game across Vice City and Leonida.",
        "platform": "PLAYSTATION_5",
        "edition": "STANDARD",
        "official_product_url": "https://store.playstation.com/concept/gta-vi",
        "image_url": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800",
        "release_status": "ANNOUNCED",
    },
    {
        "name": "Grand Theft Auto VI - Special Edition (PlayStation 5)",
        "slug": "gta-6-special-edition-ps5",
        "description": "Special Edition featuring bonus digital weapons, outfits, and Vice City collectible map pack.",
        "platform": "PLAYSTATION_5",
        "edition": "SPECIAL",
        "official_product_url": "https://store.playstation.com/concept/gta-vi-special",
        "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800",
        "release_status": "ANNOUNCED",
    },
    {
        "name": "Grand Theft Auto VI - Standard Edition (Xbox Series X/S)",
        "slug": "gta-6-standard-edition-xbox",
        "description": "Standard retail edition optimized for Xbox Series X and Xbox Series S hardware.",
        "platform": "XBOX_SERIES",
        "edition": "STANDARD",
        "official_product_url": "https://www.xbox.com/games/gta-vi",
        "image_url": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800",
        "release_status": "ANNOUNCED",
    },
    {
        "name": "Grand Theft Auto VI - Special Edition (Xbox Series X/S)",
        "slug": "gta-6-special-edition-xbox",
        "description": "Special Edition for Xbox Series X/S with exclusive Leonida vehicle customization bundles.",
        "platform": "XBOX_SERIES",
        "edition": "SPECIAL",
        "official_product_url": "https://www.xbox.com/games/gta-vi-special",
        "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800",
        "release_status": "ANNOUNCED",
    },
    {
        "name": "Grand Theft Auto VI - PC Edition (Unannounced)",
        "slug": "gta-6-pc-edition",
        "description": "Official PC version status: Rockstar Games and Take-Two Interactive have not yet announced or opened pre-orders for PC.",
        "platform": "PC",
        "edition": "STANDARD",
        "official_product_url": None,
        "image_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800",
        "release_status": "UNCONFIRMED",
    },
]

# Verified Seed Observations with historical timeline tracking
BASE_OBSERVATIONS = [
    # PS5 Standard - India
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "IND",
        "store_name": "PlayStation Store",
        "current_price": Decimal("5999.00"),
        "original_price": None,
        "currency_code": "INR",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/en-in/product/gta6-ps5",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # PS5 Standard - USA
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "USA",
        "store_name": "PlayStation Store",
        "current_price": Decimal("69.99"),
        "original_price": None,
        "currency_code": "USD",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/en-us/product/gta6-ps5",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # PS5 Standard - USA - Best Buy Preorder Promo (Discount Deal!)
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "USA",
        "store_name": "Best Buy",
        "current_price": Decimal("64.99"),
        "original_price": Decimal("69.99"),
        "currency_code": "USD",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://www.bestbuy.com/site/gta-6-playstation-5/12345.p",
        "observed_at": datetime(2026, 11, 21, 19, 30, 0, tzinfo=timezone.utc),
    },
    # PS5 Standard - GBR
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "GBR",
        "store_name": "PlayStation Store",
        "current_price": Decimal("69.99"),
        "original_price": None,
        "currency_code": "GBP",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/en-gb/product/gta6-ps5",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # PS5 Standard - EUR
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "EUR",
        "store_name": "PlayStation Store",
        "current_price": Decimal("79.99"),
        "original_price": None,
        "currency_code": "EUR",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/de-de/product/gta6-ps5",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # PS5 Standard - ARE (UAE)
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "ARE",
        "store_name": "PlayStation Store",
        "current_price": Decimal("299.00"),
        "original_price": None,
        "currency_code": "AED",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/en-ae/product/gta6-ps5",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # Xbox Standard - IND
    {
        "product_slug": "gta-6-standard-edition-xbox",
        "region_code": "IND",
        "store_name": "Xbox Marketplace",
        "current_price": Decimal("5999.00"),
        "original_price": None,
        "currency_code": "INR",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://www.xbox.com/en-in/games/store/gta-vi/9n12345",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # Xbox Standard - USA
    {
        "product_slug": "gta-6-standard-edition-xbox",
        "region_code": "USA",
        "store_name": "Xbox Marketplace",
        "current_price": Decimal("69.99"),
        "original_price": None,
        "currency_code": "USD",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://www.xbox.com/en-us/games/store/gta-vi/9n12345",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # Xbox Standard - USA - Amazon Gaming Promo (Deal!)
    {
        "product_slug": "gta-6-standard-edition-xbox",
        "region_code": "USA",
        "store_name": "Amazon Gaming",
        "current_price": Decimal("65.99"),
        "original_price": Decimal("69.99"),
        "currency_code": "USD",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://www.amazon.com/dp/B0GTA6XBOX",
        "observed_at": datetime(2026, 11, 21, 19, 0, 0, tzinfo=timezone.utc),
    },
    # PS5 Special Edition - USA
    {
        "product_slug": "gta-6-special-edition-ps5",
        "region_code": "USA",
        "store_name": "PlayStation Store",
        "current_price": Decimal("89.99"),
        "original_price": None,
        "currency_code": "USD",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/en-us/product/gta6-ps5-special",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # Xbox Special Edition - IND
    {
        "product_slug": "gta-6-special-edition-xbox",
        "region_code": "IND",
        "store_name": "Xbox Marketplace",
        "current_price": Decimal("7499.00"),
        "original_price": Decimal("7999.00"),
        "currency_code": "INR",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://www.xbox.com/en-in/games/store/gta-vi-special/9n54321",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
    # PC Edition - Informative Status: UNAVAILABLE
    {
        "product_slug": "gta-6-pc-edition",
        "region_code": "USA",
        "store_name": "Rockstar Games Store",
        "current_price": Decimal("0.00"),
        "original_price": None,
        "currency_code": "USD",
        "availability_status": "UNAVAILABLE",
        "verification_status": "UNAVAILABLE",
        "product_url": "https://store.rockstargames.com",
        "observed_at": datetime(2026, 11, 21, 18, 0, 0, tzinfo=timezone.utc),
    },
]

# Historical observation timeline for PS5 Standard (USA) to populate history chart
HISTORICAL_OBSERVATIONS = [
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "USA",
        "store_name": "PlayStation Store",
        "current_price": Decimal("69.99"),
        "original_price": None,
        "currency_code": "USD",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/en-us/product/gta6-ps5",
        "observed_at": datetime(2026, 10, 15, 12, 0, 0, tzinfo=timezone.utc),
    },
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "USA",
        "store_name": "PlayStation Store",
        "current_price": Decimal("69.99"),
        "original_price": None,
        "currency_code": "USD",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/en-us/product/gta6-ps5",
        "observed_at": datetime(2026, 11, 1, 12, 0, 0, tzinfo=timezone.utc),
    },
    {
        "product_slug": "gta-6-standard-edition-ps5",
        "region_code": "USA",
        "store_name": "PlayStation Store",
        "current_price": Decimal("69.99"),
        "original_price": None,
        "currency_code": "USD",
        "availability_status": "PREORDER_AVAILABLE",
        "verification_status": "VERIFIED",
        "product_url": "https://store.playstation.com/en-us/product/gta6-ps5",
        "observed_at": datetime(2026, 11, 15, 12, 0, 0, tzinfo=timezone.utc),
    },
]


async def seed_initial_price_data(db: AsyncSession) -> int:
    """Seeds baseline approved regions, stores, products, sources and verified observations."""
    # 1. Regions
    region_map: Dict[str, uuid.UUID] = {}
    for r_data in APPROVED_REGIONS:
        stmt = select(PriceRegion).where(PriceRegion.country_code == r_data["country_code"])
        res = await db.execute(stmt)
        reg = res.scalar_one_or_none()
        if not reg:
            reg = PriceRegion(
                id=uuid.uuid4(),
                region_name=r_data["region_name"],
                country_code=r_data["country_code"],
                currency_code=r_data["currency_code"],
                currency_symbol=r_data["currency_symbol"],
                tax_inclusive=r_data["tax_inclusive"],
                exchange_rate_to_inr=r_data["exchange_rate_to_inr"],
                exchange_rate_to_usd=r_data["exchange_rate_to_usd"],
                is_active=True,
            )
            db.add(reg)
            await db.flush()
        region_map[reg.country_code] = reg.id

    # 2. Stores
    store_map: Dict[str, uuid.UUID] = {}
    for s_data in APPROVED_STORES:
        stmt = select(PriceStore).where(PriceStore.store_name == s_data["store_name"])
        res = await db.execute(stmt)
        store = res.scalar_one_or_none()
        if not store:
            store = PriceStore(
                id=uuid.uuid4(),
                store_name=s_data["store_name"],
                website_url=s_data["website_url"],
                store_type=s_data["store_type"],
                seller_authorisation_status=s_data["seller_authorisation_status"],
                source_type=s_data["source_type"],
                is_active=True,
            )
            db.add(store)
            await db.flush()
        store_map[store.store_name] = store.id

    # 3. Sources
    for src_data in APPROVED_SOURCES:
        stmt = select(PriceSource).where(PriceSource.source_name == src_data["source_name"])
        res = await db.execute(stmt)
        source = res.scalar_one_or_none()
        if not source:
            source = PriceSource(
                id=uuid.uuid4(),
                source_name=src_data["source_name"],
                source_type=src_data["source_type"],
                source_url=src_data["source_url"],
                integration_method=src_data["integration_method"],
                is_enabled=src_data["is_enabled"],
            )
            db.add(source)
            await db.flush()

    # 4. Products
    product_map: Dict[str, uuid.UUID] = {}
    for p_data in APPROVED_PRODUCTS:
        stmt = select(PriceProduct).where(PriceProduct.slug == p_data["slug"])
        res = await db.execute(stmt)
        prod = res.scalar_one_or_none()
        if not prod:
            prod = PriceProduct(
                id=uuid.uuid4(),
                name=p_data["name"],
                slug=p_data["slug"],
                description=p_data["description"],
                platform=p_data["platform"],
                edition=p_data["edition"],
                official_product_url=p_data.get("official_product_url"),
                image_url=p_data.get("image_url"),
                release_status=p_data["release_status"],
            )
            db.add(prod)
            await db.flush()
        product_map[prod.slug] = prod.id

    # 5. Baseline & Historical Observations
    all_observations = BASE_OBSERVATIONS + HISTORICAL_OBSERVATIONS
    inserted_count = 0

    for obs in all_observations:
        prod_id = product_map.get(obs["product_slug"])
        reg_id = region_map.get(obs["region_code"])
        str_id = store_map.get(obs["store_name"])

        if not prod_id or not reg_id or not str_id:
            continue

        # Check existing observation by product, store, region, and observed_at
        stmt = select(PriceObservation).where(
            PriceObservation.product_id == prod_id,
            PriceObservation.region_id == reg_id,
            PriceObservation.store_id == str_id,
            PriceObservation.observed_at == obs["observed_at"]
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            continue

        discount = calculate_discount_percentage(obs["current_price"], obs["original_price"])
        verif_status = check_verification_status(obs["verification_status"], obs["observed_at"])

        observation = PriceObservation(
            id=uuid.uuid4(),
            product_id=prod_id,
            region_id=reg_id,
            store_id=str_id,
            current_price=obs["current_price"],
            original_price=obs["original_price"],
            currency_code=obs["currency_code"],
            discount_percentage=discount,
            availability_status=obs["availability_status"],
            verification_status=verif_status,
            product_url=obs["product_url"],
            observed_at=obs["observed_at"],
        )
        db.add(observation)
        inserted_count += 1

    await db.commit()
    logger.info(f"Price seeding complete: inserted {inserted_count} baseline observations.")
    return inserted_count
