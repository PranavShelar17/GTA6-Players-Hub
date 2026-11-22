# GTA 6 Player Hub — Target Price Alert & Notification Foundation

## 1. Overview

The **Target Price Alert System** allows authenticated players to define personal purchase thresholds (e.g., *"Notify me when GTA 6 Standard Edition drops to ₹5,000 or $60.00"*).

When new verified price observations are recorded, the system evaluates active alerts and produces persistent alert events.

---

## 2. Evaluation Logic & Event Pipeline

1. **New Price Ingestion**: Observation recorded with `verification_status="VERIFIED"`.
2. **Alert Match Query**:
   ```sql
   SELECT * FROM price_alerts
   WHERE product_id = :product_id
     AND region_id = :region_id
     AND is_active = true
     AND target_price >= :current_price;
   ```
3. **De-duplication Window**: Prevents spamming players if the price oscillates within 24 hours.
4. **Event Recording**: Inserts a record into `price_alert_events` with `delivery_status="RECORDED"`.
5. **Notification Foundation**: In Phase 8 (Notification Centre), the dispatch worker will pick up `RECORDED` events and push emails or in-app toasts to players.

---

## 3. Data Integrity & Validation

- Target price must be strictly $> 0$. Negative or zero thresholds are rejected with HTTP 422.
- Currency code must match the selected region.
- Ownership is strictly validated: players cannot create, modify, or delete alerts belonging to other user accounts.
