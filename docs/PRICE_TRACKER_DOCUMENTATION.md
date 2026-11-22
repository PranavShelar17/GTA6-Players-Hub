# GTA 6 Player Hub — Phase 5: Price & Deals Tracker Documentation

## 1. Overview & Architecture

The **GTA 6 Price & Deals Tracker** provides a centralized, transparent, and verified intelligence system for tracking retail pre-orders, official storefront offerings, and edition discounts across global gaming markets.

Prioritizing factual accuracy over raw listing volume, the module strictly adheres to financial integrity principles:
- **No Floating-Point Storage**: All currency amounts and percentages are stored using fixed-point `Numeric(10, 2)` and `Numeric(5, 2)` types.
- **Transparent Truth Standards**: Prices are tagged with explicit statuses (`VERIFIED`, `STALE`, `UNAVAILABLE`, `UNVERIFIED`).
- **No Speculative PC Pricing**: Clear disclosure: *"Official PC pricing is not currently available."*
- **Rigorous Discount Validation**: Discounts are calculated strictly from verified original and current prices: $\text{Discount} = \frac{\text{Original} - \text{Current}}{\text{Original}} \times 100$.
- **Regional Forex Transparency**: Distinct separation between native store prices and estimated INR conversions using verified reference forex rates.

---

## 2. Supported Regions & Currencies

| Region | Country Code | Native Currency | Symbol | Tax Treatment | Base Exchange Rate to INR |
|---|---|---|---|---|---|
| **India** | `IND` | `INR` | `₹` | Inclusive (GST) | 1.0000 |
| **United States** | `USA` | `USD` | `$` | Exclusive (State sales tax at checkout) | 84.5000 |
| **United Kingdom** | `GBR` | `GBP` | `£` | Inclusive (VAT) | 106.8000 |
| **Europe** | `EUR` | `EUR` | `€` | Inclusive (VAT) | 88.9000 |
| **United Arab Emirates** | `ARE` | `AED` | `AED ` | Inclusive (VAT) | 23.0100 |

---

## 3. Supported Platforms & Editions

### Platforms
1. **PlayStation 5**: Base console launch edition.
2. **Xbox Series X/S**: Microsoft ecosystem launch edition.
3. **PC (Pending)**: Officially unannounced. Guarded by Level 4 transparent disclosure.

### Editions
1. **Standard Edition**: Full base game, digital/physical disc.
2. **Special Edition**: Base game + bonus weapons, outfits, collectible map pack.
3. **Ultimate Edition**: Premium collector tier.

---

## 4. Frontend Component Hierarchy (`frontend/src/components/prices/`)

```
src/components/prices/
├── PricePageHeader.tsx          # Hero title, stats badge, last verified timestamp
├── RegionSelector.tsx           # Interactive international selector with currency symbols
├── PlatformFilter.tsx           # PlayStation, Xbox, and PC filters
├── EditionFilter.tsx            # Standard, Special, Ultimate edition toggles
├── PriceSearch.tsx              # Debounced instant search input
├── FeaturedBestPrice.tsx        # Hero card showcasing the lowest verified deal
├── PriceComparisonCard.tsx      # Edition catalog grid card with quick actions
├── PriceComparisonTable.tsx     # Full retailer comparison table (converts to mobile cards)
├── DealCard.tsx                 # Discount-centric card for the verified deals section
├── DiscountBadge.tsx            # Visual tag for discounts and lowest-price indicators
├── PriceHistoryChart.tsx        # Interactive SVG line/area chart with hover tooltip
├── PriceHistorySummary.tsx      # Statistical metrics (lowest, highest, observations count)
├── StoreInformation.tsx         # Store authorization and retailer credentials badge
├── PriceWishlistButton.tsx      # Heart toggle connected to Phase 2 authenticated sessions
├── TargetPriceForm.tsx          # Modal dialog to configure custom target price drop alerts
├── PriceAlertCard.tsx           # Active player alert management card
├── PriceUnavailableState.tsx    # Informative callout for unconfirmed pricing (PC)
├── PriceLoadingSkeleton.tsx     # Skeletons for cards and comparison tables
├── PricePageClient.tsx          # Client orchestrator for /price-deals
└── PriceDetailPageClient.tsx   # Client orchestrator for /price-deals/[slug]
```

---

## 5. Security & Ownership Protection

- **Row-Level Security (RLS)**: Enforced via PostgreSQL policies in Supabase (`backend/supabase_prices_schema.sql`).
- **Wishlist Isolation**: `auth.uid() = player_id` ensures players cannot read, edit, or delete another user's wishlist.
- **Price Alerts Protection**: Players can only view, configure, and dismiss their own target price alerts.
- **Public Data Read-Only**: Products, stores, regions, and verified observations are public for read-only access.
