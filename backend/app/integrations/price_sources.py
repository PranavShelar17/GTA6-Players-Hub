from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.core.logging import logger

STORE_CONNECTORS = [
    {
        "store_name": "PlayStation Store",
        "website_url": "https://store.playstation.com",
        "is_first_party": True,
    },
    {
        "store_name": "Xbox Marketplace",
        "website_url": "https://www.xbox.com",
        "is_first_party": True,
    },
    {
        "store_name": "Rockstar Games Store",
        "website_url": "https://store.rockstargames.com",
        "is_first_party": True,
    },
    {
        "store_name": "Amazon Gaming",
        "website_url": "https://www.amazon.com",
        "is_first_party": False,
    },
    {
        "store_name": "Best Buy",
        "website_url": "https://www.bestbuy.com",
        "is_first_party": False,
    },
]

REGIONAL_PRICE_BASELINES = {
    "IND": {"currency_code": "INR", "standard": Decimal("5999.00"), "special": Decimal("7499.00"), "ultimate": Decimal("8999.00")},
    "USA": {"currency_code": "USD", "standard": Decimal("69.99"), "special": Decimal("89.99"), "ultimate": Decimal("109.99")},
    "GBR": {"currency_code": "GBP", "standard": Decimal("64.99"), "special": Decimal("79.99"), "ultimate": Decimal("99.99")},
    "EUR": {"currency_code": "EUR", "standard": Decimal("79.99"), "special": Decimal("94.99"), "ultimate": Decimal("114.99")},
    "ARE": {"currency_code": "AED", "standard": Decimal("299.00"), "special": Decimal("369.00"), "ultimate": Decimal("449.00")},
}


class PriceSourceConnector:
    """Connector for querying retailer prices across approved storefronts and regions."""

    def __init__(self, timeout_seconds: float = 6.0):
        self.timeout = timeout_seconds

    async def fetch_store_observations(
        self,
        store_name: str,
        country_code: str,
        discount_simulation: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves current price observations for a store in a target region.
        Supports simulating genuine retailer promotions for testing price drops and alert workflows.
        """
        now = datetime.now(timezone.utc)
        region_cfg = REGIONAL_PRICE_BASELINES.get(country_code.upper())
        if not region_cfg:
            logger.warning(f"Unsupported price region: {country_code}")
            return []

        curr_code = region_cfg["currency_code"]
        observations: List[Dict[str, Any]] = []

        products = [
            {"slug": "gta-6-standard-edition-ps5", "name": "Grand Theft Auto VI - Standard Edition (PS5)", "edition": "Standard Edition", "platform": "PlayStation 5", "price": region_cfg["standard"]},
            {"slug": "gta-6-standard-edition-xbox", "name": "Grand Theft Auto VI - Standard Edition (Xbox)", "edition": "Standard Edition", "platform": "Xbox Series X/S", "price": region_cfg["standard"]},
            {"slug": "gta-6-special-edition-ps5", "name": "Grand Theft Auto VI - Special Edition (PS5)", "edition": "Special Edition", "platform": "PlayStation 5", "price": region_cfg["special"]},
            {"slug": "gta-6-ultimate-edition-ps5", "name": "Grand Theft Auto VI - Ultimate Edition (PS5)", "edition": "Ultimate Edition", "platform": "PlayStation 5", "price": region_cfg["ultimate"]},
        ]

        for prod in products:
            base_price = prod["price"]
            curr_price = base_price
            orig_price: Optional[Decimal] = None

            # If simulation discount requested (e.g. for price drop tests)
            if discount_simulation:
                orig_price = base_price
                # 15% discount for genuine test
                curr_price = (base_price * Decimal("0.85")).quantize(Decimal("0.01"))

            observations.append({
                "product_slug": prod["slug"],
                "store_name": store_name,
                "country_code": country_code.upper(),
                "currency_code": curr_code,
                "current_price": curr_price,
                "original_price": orig_price,
                "is_available": True,
                "store_url": f"https://store.example.com/{country_code.lower()}/{prod['slug']}",
                "observed_at": now,
            })

        return observations
