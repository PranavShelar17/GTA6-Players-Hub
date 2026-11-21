# GTA 6 Player Hub – News & Updates System Documentation

## 1. System Overview

The **GTA 6 News & Updates** subsystem is an editorial and intelligence module designed to provide players with verified information about Grand Theft Auto VI. It establishes an authoritative record of official announcements, developer insights, technical breakdowns, and verified press investigations, while maintaining a strict boundary against unsubstantiated rumours.

---

## 2. 4-Tier Truth & Verification Standard

Every published news article in the database is tagged with one of four immutable verification levels:

| Tier | Badge | Definition | Mandatory Evidence |
| :--- | :--- | :--- | :--- |
| **OFFICIAL** | Amber Badge | Statements issued directly by Rockstar Games or Take-Two Interactive. | Direct URL to Rockstar Newswire, official social broadcast, or SEC earnings disclosure. |
| **VERIFIED** | Emerald Badge | Corroborated investigative reporting from established gaming journalism. | Named source from accredited outlets (Digital Foundry, IGN, Eurogamer, GameSpot). |
| **RUMOUR** | Rose Badge | Industry rumours, patent filings, or unconfirmed leaks with public interest. | Explicit disclaimer stating that information is not confirmed by Rockstar Games. |
| **UNCONFIRMED**| Slate Badge | Speculation, estimated cadences, or community deductions. | Notice explaining that official verification is currently pending. |

---

## 3. Database Architecture & Schema

### 3.1 Tables Overview
- **`news_sources`**: Authoritative publishers with trust ratings, feed URLs, and collection state.
- **`news_categories`**: Hierarchical content taxonomy (e.g., Announcements, Tech, Map, Characters).
- **`news_articles`**: Normalized article entries with canonical URLs, full markdown content, 4-tier truth badges, and reading times.
- **`news_bookmarks`**: Many-to-one relationship linking authenticated `player_id` to bookmarked `article_id`.

### 3.2 Relational Diagram
```
┌──────────────────┐          ┌──────────────────┐
│   news_sources   │          │ news_categories  │
└────────┬─────────┘          └────────┬─────────┘
         │ 1                           │ 1
         │                             │
         │ *                           │ *
┌────────┴─────────────────────────────┴─────────┐
│                 news_articles                  │
└────────────────────────┬───────────────────────┘
                         │ 1
                         │
                         │ *
                ┌────────┴────────┐
                │ news_bookmarks  │
                └─────────────────┘
```

---

## 4. Duplicate Detection Engine

To prevent redundant duplicate articles from being displayed across different aggregator queries, the ingestion engine uses **Canonical URL Normalization**:

```python
def normalize_url(url: str) -> str:
    # 1. Strip fragments (#section)
    # 2. Strip tracking query parameters (?utm_source=...)
    # 3. Lowercase scheme and host
    # 4. Remove trailing slashes
    clean = url.split("#")[0].split("?")[0].strip().lower()
    return clean.rstrip("/")
```
Before any article is inserted into `news_articles`, the database checks:
1. `canonical_url == normalized_url`
2. `slug == article_slug`

If a matching record exists, the duplicate is skipped and logged.

---

## 5. Editorial Summarization & Copyright Safety

In strict compliance with fair use and intellectual property laws:
- Complete external articles are **never copied**.
- Articles are independently digested into concise, high-value technical summaries.
- The original publisher and direct source link are always cited prominently.
- No copyrighted GTA 6 video captures or unauthorized assets are distributed.
