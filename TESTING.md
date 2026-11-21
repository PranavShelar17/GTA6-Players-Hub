# GTA 6 Player Hub – Testing Strategy & Quality Assurance

## 1. Testing Philosophy & Pyramid

To ensure zero regressions, resilient API contracts, and an uncompromised user experience, GTA 6 Player Hub adheres to a multi-tiered testing pyramid:

```
          / \
         / E2E \       Playwright (Critical User Flows)
        /-------\
       /  Integ. \     pytest-asyncio + TestClient + Vitest Components
      /-----------\
     /    Unit     \   pytest (Business Logic) + Vitest (UI Hooks & Utils)
    /---------------\
```

---

## 2. Test Suites & Coverage Targets

| Test Category | Target Coverage | Framework | Primary Targets |
| :--- | :--- | :--- | :--- |
| **Backend Unit** | > 85% | `pytest`, `pytest-mock` | Bottleneck analysis math, price discount calculations, currency normalizations, input validation. |
| **Backend API** | > 90% | `httpx`, `pytest-asyncio` | REST route contracts, authentication middleware, status codes, error envelopes. |
| **Frontend Unit** | > 80% | `vitest`, React Testing Library | Custom hooks, formatters, state reducers, UI components. |
| **End-to-End (E2E)** | Key Paths | `playwright` | Registration/Login flow, PC Checker form submission, Deal filtering, Community post creation. |
| **AI Safety & RAG** | 100% Guardrails | `pytest` eval suites | Test adversarial prompts, ensure refusal of dangerous tweaks, verify disclaimer presence. |

---

## 3. Backend Test Suite Organization

```
backend/tests/
├── conftest.py                   # Async test client, DB fixtures, mock auth tokens
├── unit/
│   ├── test_hardware_engine.py   # Test CPU/GPU bottleneck equations
│   ├── test_pricing_engine.py    # Test INR conversion & discount algorithms
│   └── test_ai_guardrails.py     # Test safety sanitizers and blacklist checks
├── integration/
│   ├── test_auth_routes.py       # Registration, login, profile updates
│   ├── test_news_routes.py       # News query filters, bookmarking
│   ├── test_deals_routes.py      # Deal listing, wishlist alerts
│   ├── test_community_routes.py  # Post creation, comments, moderation flags
│   └── test_support_routes.py    # Support chat endpoints & RAG context lookup
└── e2e/
    └── test_full_pipeline.py     # Celery sync to notification dispatch loop
```

### Running Backend Tests
```powershell
cd backend
pytest -v --cov=app --cov-report=term-missing
```

---

## 4. Frontend Test Suite Organization

```
frontend/tests/
├── components/
│   ├── HeroSection.test.tsx
│   ├── PcCheckerForm.test.tsx
│   └── DealCard.test.tsx
├── hooks/
│   ├── useDealsFilter.test.ts
│   └── useHardwareCalc.test.ts
└── e2e/
    ├── home.spec.ts
    ├── pc-checker.spec.ts
    └── community.spec.ts
```

### Running Frontend Tests
```powershell
cd frontend
npm run test          # Vitest Unit & Component tests
npm run test:e2e      # Playwright End-to-End tests
```

---

## 5. Manual QA Checklist for Each of the 6 Core Pages

Before any release or phase completion sign-off:

1. **Page 1 (Home)**:
   - [ ] Hero countdown computes exact remaining time in local timezone.
   - [ ] Breaking news banner loads official items first.
   - [ ] Navigation bar links cleanly to all 5 other pages.
   - [ ] Global search palette opens with `Cmd+K` or search bar click.

2. **Page 2 (Gaming Community)**:
   - [ ] Non-logged in visitors can view feed, but clicking Like/Comment prompts Login.
   - [ ] Profanity and abuse keywords are blocked with a clear user notice.
   - [ ] Image upload rejects files > 5MB and non-image MIME types.

3. **Page 3 (News & Updates)**:
   - [ ] Every article renders an explicit badge: `OFFICIAL`, `VERIFIED`, `RUMOUR`, or `UNCONFIRMED`.
   - [ ] Original source attribution link opens in a new tab with `rel="noopener noreferrer"`.
   - [ ] Filtering by category returns accurate subsets.

4. **Page 4 (PC Compatibility Checker)**:
   - [ ] Highlighting unconfirmed status disclaimer is prominently visible.
   - [ ] Selecting unbalanced CPU/GPU triggers bottleneck percentage calculation.
   - [ ] Upgrade suggestions adhere to the chosen budget tier.

5. **Page 5 (Gaming Problem Solver)**:
   - [ ] Submitting known error code (e.g., `ERR_GFX_D3D_INIT`) retrieves exact verified steps.
   - [ ] Querying dangerous actions (e.g. "how to delete system32 or flash custom bios") is explicitly refused.
   - [ ] Helpfulness feedback buttons trigger confirmation state.

6. **Page 6 (Price & Deals Tracker)**:
   - [ ] Switching country filter converts prices to local currency (INR, USD, EUR, etc.).
   - [ ] Only verified authorized stores display the verification shield.
   - [ ] Historical price chart renders all data points accurately on mobile and desktop.
