# GTA 6 Player Hub – Notification REST API Documentation
## Phase 6 API Reference Specification

Base URL: `http://127.0.0.1:8000/api/v1`

All responses follow the RFC 7807 universal envelope standard:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-11-22T08:00:00Z",
    "version": "1.0.0",
    "request_id": null
  }
}
```

---

### 1. Events Endpoints

#### `GET /events/categories`
- **Auth**: None (Public)
- **Description**: Lists all active event categories with event count aggregations.
- **Response**: `ApiResponse[List[EventCategoryRead]]`

#### `GET /events`
- **Auth**: Optional Bearer Token
- **Query Parameters**:
  - `category` (string, optional): Category slug filter (e.g. `corporate-financial`).
  - `status` (string, optional): Verification status (`OFFICIAL`, `VERIFIED`, `COMMUNITY`, `UNCONFIRMED`).
  - `timeframe` (string, default: `upcoming`): `upcoming`, `past`, `all`.
  - `search` (string, optional): Search keyword against title, description, or organizer.
  - `page` (int, default: 1): Page number.
  - `limit` (int, default: 20): Items per page.
- **Response**: `ApiResponse[List[EventListItem]]`

#### `GET /events/{slug}`
- **Auth**: Optional Bearer Token
- **Description**: Returns complete details for an event including related category events and user reminder status.
- **Response**: `ApiResponse[EventDetail]` (or 404)

#### `POST /events/{event_id}/save`
- **Auth**: Required Bearer Token
- **Description**: Saves or bookmarks an event to the player's personal calendar.
- **Body**: `{"notes": "Optional player notes"}`
- **Response**: `ApiResponse[{"is_saved": true, "message": "..."}]`

#### `DELETE /events/{event_id}/save`
- **Auth**: Required Bearer Token
- **Description**: Removes an event from the player's personal calendar.
- **Response**: `ApiResponse[{"is_saved": false, "message": "..."}]`

#### `GET /events/saved`
- **Auth**: Required Bearer Token
- **Description**: Retrieves all events saved by the authenticated player.
- **Response**: `ApiResponse[List[SavedEventRead]]`

#### `POST /events/{event_id}/reminders`
- **Auth**: Required Bearer Token
- **Body**:
  ```json
  {
    "lead_time_minutes": 60,
    "channel": "IN_APP"
  }
  ```
- **Response**: `ApiResponse[EventReminderRead]`

#### `DELETE /events/reminders/{reminder_id}`
- **Auth**: Required Bearer Token
- **Response**: `ApiResponse[{"deleted": true, "message": "Reminder cancelled."}]`

---

### 2. Notification Centre Endpoints

#### `GET /notifications`
- **Auth**: Required Bearer Token
- **Query Parameters**:
  - `is_read` (boolean, optional): Filter by read status.
  - `notification_type` (string, optional): Filter by category (`NEWS_UPDATE`, `PRICE_DROP`, etc.).
  - `page` (int, default: 1)
  - `limit` (int, default: 20)
- **Response**: `ApiResponse[List[NotificationRead]]`

#### `GET /notifications/unread-count`
- **Auth**: Required Bearer Token
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "total_unread": 3,
      "unread_by_type": {
        "NEWS_UPDATE": 1,
        "PRICE_DROP": 1,
        "EVENT_REMINDER": 1
      }
    }
  }
  ```

#### `PATCH /notifications/{notification_id}/read`
- **Auth**: Required Bearer Token
- **Response**: `ApiResponse[{"marked_as_read": true}]`

#### `POST /notifications/mark-all-read`
- **Auth**: Required Bearer Token
- **Response**: `ApiResponse[{"marked_count": 3}]`

#### `DELETE /notifications/{notification_id}`
- **Auth**: Required Bearer Token
- **Response**: `ApiResponse[{"deleted": true}]`

#### `GET /notifications/preferences`
- **Auth**: Required Bearer Token
- **Response**: `ApiResponse[NotificationPreferencesRead]`

#### `PATCH /notifications/preferences`
- **Auth**: Required Bearer Token
- **Body**: Partial updates to channel toggles, alert topics, and quiet hours.
- **Response**: `ApiResponse[NotificationPreferencesRead]`

#### `POST /notifications/push/subscribe`
- **Auth**: Required Bearer Token
- **Body**: Browser push subscription payload (`endpoint`, `p256dh`, `auth`, `user_agent`).
- **Response**: `ApiResponse[PushSubscriptionRead]`

#### `DELETE /notifications/push/unsubscribe`
- **Auth**: Required Bearer Token
- **Query Parameter**: `endpoint`
- **Response**: `ApiResponse[{"unsubscribed": true}]`
