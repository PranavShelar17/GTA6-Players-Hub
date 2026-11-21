# GTA 6 Player Hub – Testing Strategy & Quality Assurance

## 1. Testing Philosophy & Pyramid

To ensure zero regressions, resilient API contracts, and an uncompromised user experience, GTA 6 Player Hub adheres to a multi-tiered testing pyramid:

```
          / \
         / E2E \       Playwright / Next.js Production Build Validation
        /-------\
       /  Integ. \     pytest-asyncio + TestClient + Mock Auth Fixtures
      /-----------\
     /    Unit     \   pytest (Database Models & Validation) + Typecheck
    /---------------\
```

---

## 2. Test Execution Commands

### Run Full System Test Runner (One-Click)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-all.ps1
```

### Run Backend Pytest Suite Only
```powershell
cd backend
.\venv\Scripts\pytest -v
```

### Run Frontend Typecheck & Production Build Only
```powershell
cd frontend
npm run build
```

---

## 3. Backend Test Suite Coverage (`backend/tests/`)

The backend test suite (`34 tests, 100% pass rate in ~13s`) validates:

### Health & Architecture (3 tests)
1. **`test_health_endpoint`**: Verifies HTTP 200, liveness payload, and metadata.
2. **`test_readiness_endpoint`**: Verifies HTTP 200 and subsystem dependency checks.
3. **`test_404_error_envelope`**: Verifies standard RFC 7807 error envelopes on non-existent routes.

### Home Page Aggregator (6 tests)
4. **`test_get_homepage_aggregated_feed`**: Verifies `GET /api/v1/home` returns news, deals, events, community highlights, and disclaimer.
5. **`test_get_homepage_feed_localized_preferences`**: Verifies passing `country_code`, `currency`, and `platform` filters and localizes output.
6. **`test_get_home_news_endpoint`**: Verifies `GET /api/v1/home/news` isolated feed and 4-tier verification labels.
7. **`test_get_home_deals_endpoint`**: Verifies `GET /api/v1/home/deals` isolated feed and regional currency filtering.
8. **`test_get_home_events_endpoint`**: Verifies `GET /api/v1/home/events` isolated milestone countdowns.
9. **`test_get_home_community_endpoint`**: Verifies `GET /api/v1/home/community` isolated discussions and counters.

### News & Updates Subsystem (15 tests)
10. **`test_get_news_categories`**: Verifies active category list and article counts.
11. **`test_get_news_sources`**: Verifies safe public source listings and trust levels.
12. **`test_get_news_stats`**: Verifies aggregate factual reporting metrics.
13. **`test_get_news_list_pagination`**: Verifies paginated listing, total counts, and page sizing.
14. **`test_get_news_search_filter`**: Verifies keyword search matching title and summary.
15. **`test_get_news_category_filter`**: Verifies filtering by category slug.
16. **`test_get_news_verification_status_filter`**: Verifies 4-tier status filtering (`OFFICIAL`, `VERIFIED`, `RUMOUR`, `UNCONFIRMED`).
17. **`test_get_news_sorting`**: Verifies ascending/descending chronological sorting.
18. **`test_get_featured_news`**: Verifies primary featured article retrieval.
19. **`test_get_news_detail_success`**: Verifies full article payload, content, and related articles.
20. **`test_get_news_detail_not_found`**: Verifies 404 response on invalid slug.
21. **`test_get_related_news`**: Verifies related articles retrieval based on category.
22. **`test_unauthenticated_bookmark_rejected`**: Verifies HTTP 401 when anonymous user attempts to bookmark.
23. **`test_bookmark_lifecycle`**: Verifies complete bookmark add, list, and delete workflow for authenticated player.
24. **`test_trigger_news_collection`**: Verifies automated ingestion trigger and duplicate prevention.

### Player Identity & Security (10 tests)
25. **`test_unauthenticated_access_rejected`**: Verifies HTTP 401 when requesting protected endpoints without a token.
26. **`test_get_current_player_auto_initialization`**: Verifies first-time login automatically provisions `player_profiles` and `player_preferences`.
27. **`test_check_username_availability`**: Verifies live username availability checking, format validation, and availability state.
28. **`test_update_profile_and_username_conflict`**: Verifies User A can update profile, and User B is rejected with HTTP 409 Conflict when attempting to claim User A's username (case-insensitive).
29. **`test_profile_validation_rules`**: Verifies strict Pydantic validation on username regex, platform whitelists, and lengths.
30. **`test_update_preferences`**: Verifies updating currency, regional country code, and notification flags.
31. **`test_avatar_upload_validation`**: Verifies valid PNG/JPEG uploads succeed, invalid MIME types return HTTP 400, and oversized files (>2MB) return HTTP 400.
32. **`test_avatar_deletion`**: Verifies deleting custom avatar resets profile `avatar_url` to null.
33. **`test_user_activity_logging`**: Verifies security activities are recorded in `player_activities`.
34. **`test_account_deletion_workflow`**: Verifies user profile, preferences, and activity records are cleanly deleted upon request.
