# GTA 6 Player Hub — Price Source Integration & Ingestion Architecture

## 1. Overview

The price ingestion pipeline standardizes and verifies retail pre-order listings across authorized digital marketplaces and physical game retailers.

To protect data authenticity, the system implements strict source authorization rules:
1. **First-Party Stores**: Official PlayStation Store, Xbox Marketplace, and Rockstar Games Store.
2. **Authorized Retailers**: Major certified gaming distributors (e.g., Amazon Gaming, Best Buy).
3. **Unverified Third Parties**: Barred from contributing to verified price comparisons or target price alerts.

---

## 2. Configured Data Sources

| Source Name | Type | Integration Method | Status | Notes |
|---|---|---|---|---|
| **PlayStation Direct API** | `FIRST_PARTY` | `API` | **Active** | Official digital PS5 pre-orders across global storefronts. |
| **Microsoft Xbox Catalog API** | `FIRST_PARTY` | `API` | **Active** | First-party Xbox Series X/S marketplace feed. |
| **Rockstar Games Web Catalog** | `OFFICIAL_STORE` | `CURATED` | **Active** | Official publisher announcements and special edition bundles. |
| **Authorised Retailers Syndicate** | `AFFILIATE_FEED` | `FEED` | **Active** | Physical box pre-orders from verified partners (Amazon, Best Buy). |

---

## 3. Truth & Freshness Rules

- **Freshness Window**: 72 hours.
- If a price observation is older than 72 hours without fresh publisher re-verification, its status automatically transitions from `VERIFIED` to `STALE`.
- Stale prices are labeled with a warning badge and excluded from triggering automated price alerts.
- Unavailable products (e.g. PC edition) are marked `UNAVAILABLE`, preventing false zero-dollar listings from rendering as discounts.

---

## 4. Unconnected Sources & Technical Limitations

- **PC Digital Storefronts (Steam / Epic Games Store)**:
  - *Status*: Not connected.
  - *Reason*: Rockstar Games has not scheduled or listed GTA 6 on Steam or Epic Games Store. Integrating speculative listings would violate our truth and accuracy standards.
- **Gray-Market Key Resellers**:
  - *Status*: Prohibited.
  - *Reason*: Marketplaces with unauthorized third-party keys are permanently barred due to risk of revoked licenses and fraudulent pricing.
