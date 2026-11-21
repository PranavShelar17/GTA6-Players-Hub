# GTA 6 Player Hub – News Source Configuration & Governance

## 1. Source Classification & Priority Hierarchy

The platform categorizes external publishers into three strict operational trust tiers:

### Priority 1 – Official Sources (Level 1 Trust)
- **Rockstar Games Newswire**: Official corporate bulletin (`https://www.rockstargames.com/newswire`)
- **Take-Two Interactive Investor Relations**: SEC filings, shareholder webcasts, and earnings transcripts (`https://www.take2games.com/ir`)

### Priority 2 – Established Gaming Publications (Level 2 Trust)
- **Digital Foundry / Eurogamer**: Specialized hardware analysis, ray-tracing benchmarks, engine teardowns (`https://www.eurogamer.net/digitalfoundry`)
- **PlayStation Blog**: Sony platform optimization notes, DualSense haptics, and PS5 Pro features (`https://blog.playstation.com`)
- **IGN Gaming**: Industry reporting, developer interviews, and confirmed promotional breakdowns (`https://www.ign.com`)
- **GameSpot**: Industry cadence analyses and launch timeline tracking (`https://www.gamespot.com`)

### Priority 3 – Community Deductions (Level 3 Trust - Labeled RUMOUR/UNCONFIRMED)
- Patent filings and spatial cartography analyses. Strictly segregated under `RUMOUR` or `UNCONFIRMED` labels.

---

## 2. Ingestion Rules & Rate Limits

- **Polite Crawling**: Ingestion tasks use standard HTTP headers with a dedicated identifier:
  `User-Agent: GTA6PlayerHub-NewsBot/1.0 (+https://gta6playerhub.local)`
- **Request Frequency**: Source feeds are polled no more than once per hour in automated background routines.
- **Failure Backoff**: When an external feed returns a non-200 code or network timeout, the error is recorded in `news_sources.last_error` and the source enters an exponential backoff state without interrupting user traffic.
- **Paywalls & Anti-Bot Gates**: No paywalled content, anti-bot gates, or authentication screens are ever bypassed.

---

## 3. Registered Source Catalog in Database

| Source Name | Type | Trust Level | Feed / Endpoint | Method |
| :--- | :--- | :--- | :--- | :--- |
| **Rockstar Games Newswire** | OFFICIAL | OFFICIAL | `/newswire.rss` | RSS / Direct |
| **Take-Two Interactive IR** | OFFICIAL | OFFICIAL | SEC / Investor Relations | Curated Feed |
| **PlayStation Blog** | PRESS | VERIFIED | `/feed/` | RSS |
| **Digital Foundry** | PRESS | VERIFIED | `/feed/digitalfoundry` | RSS |
| **IGN Gaming** | PRESS | VERIFIED | `/all` | RSS |
| **GameSpot** | PRESS | VERIFIED | `/feeds/mashup/` | RSS |
