# GTA 6 Player Hub — Price REST API Specification

All Price endpoints reside under the `/api/v1/prices` prefix and return standard RFC 7807 unified response envelopes:

```json
{
  "success": true,
  "data": ...,
  "error": null,
  "meta": {
    "timestamp": "2026-11-22T12:00:00Z",
    "version": "1.0.0"
  }
}
```

---

## Endpoints

### 1. `GET /api/v1/prices/regions`
Returns supported international regions, native currency codes, tax inclusion flags, and reference exchange rates to INR/USD.

### 2. `GET /api/v1/prices/stores`
Returns registered stores with type (`FIRST_PARTY`, `AUTHORISED_RETAILER`) and seller authorization status.

### 3. `GET /api/v1/prices/stats`
Returns system metrics: total tracked products, total observations, verified count, active deals count, supported regions and stores.

### 4. `GET /api/v1/prices/products`
Lists tracked game editions.
- **Query Parameters**:
  - `platform` (optional): `PLAYSTATION_5`, `XBOX_SERIES`, `PC`
  - `edition` (optional): `STANDARD`, `SPECIAL`, `ULTIMATE`
  - `search` (optional): search by title
  - `country_code` (default: `USA`): region context for lowest price calculation

### 5. `GET /api/v1/prices/products/{slug}`
Returns full product detail, available regions, lowest verified price, and current observations.

### 6. `GET /api/v1/prices/compare`
Compares retailer offers for a product in a selected region.
- **Query Parameters**:
  - `slug` (required): e.g. `gta-6-standard-edition-ps5`
  - `country_code` (default: `IND`): region code

### 7. `GET /api/v1/prices/deals`
Retrieves genuine discounts sorted by discount percentage and price.
- **Query Parameters**:
  - `platform` (optional)
  - `country_code` (optional)
  - `min_discount` (default: `0.01`): minimum discount %
  - `limit` (default: `10`, max: `50`)

### 8. `GET /api/v1/prices/products/{slug}/history`
Returns chronological observation records for price history charts.
- **Query Parameters**:
  - `slug` (required)
  - `country_code` (default: `USA`)

### 9. `GET /api/v1/prices/wishlist` *(Authenticated)*
Returns authenticated player's wishlisted products with localized pricing.

### 10. `POST /api/v1/prices/wishlist/{product_id}` *(Authenticated)*
Adds a product to the player's wishlist.

### 11. `DELETE /api/v1/prices/wishlist/{product_id}` *(Authenticated)*
Removes a product from the player's wishlist.

### 12. `GET /api/v1/prices/alerts` *(Authenticated)*
Returns all target price alerts configured by the authenticated player.

### 13. `POST /api/v1/prices/alerts` *(Authenticated)*
Creates a new target price alert.
- **Body**:
  ```json
  {
    "product_id": "uuid",
    "region_id": "uuid",
    "target_price": 4999.00,
    "currency_code": "INR"
  }
  ```

### 14. `PATCH /api/v1/prices/alerts/{alert_id}` *(Authenticated)*
Updates an alert's threshold or active status.

### 15. `DELETE /api/v1/prices/alerts/{alert_id}` *(Authenticated)*
Deletes a target price alert.
