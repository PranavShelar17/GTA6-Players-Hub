# AUTOMATED DATA SOURCE DOCUMENTATION: GTA 6 PLAYER HUB
**External Integrations, Ingestion Protocols, and Verification Standard**
**Version**: 1.0.0 (Phase 10)  

---

## 1. Registry of Approved Data Sources

The GTA 6 Player Hub ingests data from verified, official, and permitted external channels. No unauthorized scraping, paywall bypassing, or credential harvesting is permitted.

### 1.1 News & Announcement Sources

| Source Name | Ingestion Type | Feed / Endpoint URL | Verification Level | Ingestion Frequency |
|---|---|---|---|---|
| Rockstar Games Newswire | RSS XML | `https://www.rockstargames.com/newswire.rss` | `OFFICIAL` | Every 30 minutes |
| Take-Two Interactive IR | Corporate RSS | `https://www.take2games.com/ir/news.xml` | `OFFICIAL` | Every 60 minutes |
| PlayStation Blog | Permitted RSS | `https://blog.playstation.com/feed/` | `VERIFIED` | Every 60 minutes |
| Xbox Wire | Permitted RSS | `https://news.xbox.com/en-us/feed/` | `VERIFIED` | Every 60 minutes |
| Digital Foundry (Eurogamer) | Tech RSS | `https://www.eurogamer.net/feed/digitalfoundry` | `VERIFIED` | Daily |

### 1.2 Digital Store & Pricing Sources

| Store Name | Platform | Ingestion Type | Regions Covered | Currency | Polling Frequency |
|---|---|---|---|---|---|
| PlayStation Store | PS5 | Direct Store API / Structured Catalog | IND, USA, GBR, EUR, ARE | INR, USD, GBP, EUR, AED | Every 2 hours |
| Xbox Marketplace | Xbox Series X/S | Direct Catalog API | IND, USA, GBR, EUR, ARE | INR, USD, GBP, EUR, AED | Every 2 hours |
| Steam (Valve) | PC | Store API / App Details | IND, USA, GBR, EUR, ARE | INR, USD, GBP, EUR, AED | Every 3 hours |
| Epic Games Store | PC | Store Catalog API | IND, USA, GBR, EUR, ARE | INR, USD, GBP, EUR, AED | Every 3 hours |
| Rockstar Store | PC / Console | Official Storefront | IND, USA, GBR, EUR, ARE | INR, USD, GBP, EUR, AED | Every 2 hours |

### 1.3 Event Calendar Sources

| Source Name | Covered Event Types | Primary Timezone | Feed URL |
|---|---|---|---|
| Rockstar Newswire Events | Trailer Reveals, Community Updates | US/Eastern (EST/EDT) | `https://www.rockstargames.com/newswire` |
| Take-Two Earnings Webcasts | Financial quarterly calls, GTA VI timeline | US/Eastern (EST/EDT) | `https://www.take2games.com/ir` |
| PlayStation State of Play | Digital live showcases, console exclusivity | US/Pacific (PST/PDT) | `https://blog.playstation.com` |
| Summer Game Fest / TGA | Industry awards and premiere showcases | US/Pacific (PST/PDT) | `https://www.summergamefest.com` |

---

## 2. News Verification & Truth Preservation Standard

The ingestion pipeline strictly enforces content categorization rules:

1. **`OFFICIAL`**:
   - MUST originate directly from `Rockstar Games Newswire` or `Take-Two Interactive IR`.
   - Third-party gaming articles that merely mention Rockstar Games in their headline or text are NEVER assigned `OFFICIAL`.
2. **`VERIFIED`**:
   - Sourced from first-party platform holders (`PlayStation Blog`, `Xbox Wire`, `Sony Interactive`, `Microsoft`) or authoritative industry technical analysis (`Digital Foundry`).
3. **`RUMOUR`**:
   - Community-reported leaks, unverified retailer listings, or insider speculation. Handled through manual moderation approval before public surfacing.
4. **`UNCONFIRMED`**:
   - Speculative release dates or pricing leaks lacking publisher confirmation. Always displayed with warning labels across the user interface.

---

## 3. Data Normalization & Validation Rules

Before saving observations to PostgreSQL, all records pass through `DataValidationService`:

### 3.1 URL Canonicalization
- Scheme must be `http` or `https` (rejects `ftp:`, `javascript:`, relative paths).
- Strips fragment identifiers (`#comments`, `#header`).
- Strips tracking query parameters (`utm_*`, `ref`, `fbclid`, `gclid`).
- Lowercases domain and standardizes URL paths.

### 3.2 Monetary Precision & Currency Validation
- Stores prices as exact PostgreSQL `numeric(10, 2)` types (never imprecise floating-point numbers).
- Validates 3-letter ISO 4217 currency codes (`INR`, `USD`, `GBP`, `EUR`, `AED`).
- Cross-validates currency with region (`IND` must match `INR`, `USA` must match `USD`, etc.).
- Original price must be greater than or equal to current price. Discounts are computed as:
  $$\text{Discount \%} = \frac{\text{Original Price} - \text{Current Price}}{\text{Original Price}} \times 100$$
  Rounded to 2 decimal places.

### 3.3 Timezone Normalization
- String dates (ISO 8601 or RFC 2822) are parsed and converted to timezone-aware UTC `datetime` objects.
- Preserves the source's original timezone name (e.g., `US/Eastern`, `Europe/London`) for localized player rendering.

---

## 4. Stale Data Handling & Fallbacks

- If a third-party store API fails or responds with non-200 status codes:
  - Last known observation is preserved in the database.
  - Record's `verification_status` is updated to `STALE` if older than 24 hours.
  - The source's status in `data_source_status` transitions to `DEGRADED`.
  - The frontend displays a warning indicator ("Price last verified 2 days ago") rather than misrepresenting it as live data.
