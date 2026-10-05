# CINEHA AI — Quality Assurance & Testing Strategy

This document establishes the testing protocols, unit test suites, integration checkpoints, and automated validation gates.

---

## 1. Test Suite Architecture

```
apps/
├── web/
│   └── tests/
│       ├── unit/
│       │   ├── useScriptGeneration.test.ts
│       │   ├── useCreatorProfile.test.ts
│       │   └── reducers.test.ts
│       ├── components/
│       │   ├── ScriptWorkspace.test.tsx
│       │   ├── HookCard.test.tsx
│       │   └── Accessible2DWorkflow.test.tsx
│       └── e2e/
│           └── navigation_and_generation.spec.ts
│
└── api/
    └── tests/
        ├── test_health.py
        ├── test_profile_api.py
        ├── test_hook_agent.py
        ├── test_script_agent.py
        ├── test_review_agent.py
        ├── test_orchestrator.py
        ├── test_video_analysis.py
        └── test_calendar_crud.py
```

---

## 2. Test Suites & Coverage Targets

### A. Frontend Unit & Component Tests (Jest / Vitest + React Testing Library)
- **Compound Components:** Asserts `<ScriptWorkspace>` renders header, input form, and preview pane with synchronized state.
- **Form Validation:** Checks required field alerts for missing topic, invalid duration, or missing platform selection.
- **Accessibility & ARIA:** Verifies all buttons, inputs, and tab navigation satisfy WCAG 2.1 AA keyboard navigability.
- **3D Fallback:** Simulates WebGL error and asserts `Accessible2DWorkflow` is displayed without thrown runtime exceptions.
- **Settings Workspace (`settings.test.tsx`):**
  - Typed persistence layer: default loading, graceful malformed JSON recovery, non-object JSON handling, deep merge, and update broadcasting.
  - Safe factory reset & cache clear: preserves creator profile persona and database items.
  - 8-section tab navigation: theme/density controls, Zero-Leak security assertions, strict exclusion of Hindi from caption defaults, 100MB video limit badge, 10 caption templates & free positioning sliders, ConfirmationModal dialogs, and live diagnostics latency testing.

### B. Backend Unit & Integration Tests (Pytest + pytest-asyncio)
- **API Health (`test_health.py`):** Verifies `GET /api/v1/health` and `GET /api/v1/health/providers` respond with 200 and include safe Gemini and Local Whisper diagnostics without exposing credentials.
- **Agent Schema Validation:** Asserts that invalid LLM outputs trigger Pydantic `ValidationError` and engage fallback handlers.
- **Orchestrator Routing:** Tests full pipeline execution vs quick single-agent generation.
- **Video Retention Analysis (`test_video_analysis.py`):**
  - Container validation: 100MB boundary, >100MB rejection (413), zero-byte check (400), extension check (415).
  - Metadata extraction via FFmpeg probe: dimensions, FPS, duration, audio stream detection.
  - Silent/no-audio video graceful degradation: returns 200 with `transcript.available=False` and clear limitations notice.
  - Deterministic metrics scoring bounds: all 10 retention criteria strictly bounded 0–100.
  - Anti-hallucination timestamps: zero fabricated timestamps; segment timestamps match audio model 1:1.
  - Gemini semantic analysis: validates structured response and verifies graceful local heuristic fallback on timeout/error.
  - Database persistence: persists to `video_analyses` and verifies retrieval via `GET /video-analysis/{analysis_id}`.
- **Database Persistence:** Confirms SQLite/PostgreSQL CRUD operations, cascade deletes, and version increments.


### C. Heuristic Quality Tests
- Asserts that Telugu script generation outputs proper Telugu and Tenglish vocabulary rather than generic transliteration errors.
- Asserts that hook classification produces exactly one of the 9 validated taxonomy keys.

---

## 3. Test Execution Commands

### Run Frontend Tests
```bash
cd apps/web
npm test
```

### Run Backend Tests
```bash
cd apps/api
pytest -v --asyncio-mode=auto
```

---

## 7. Current Test Suite Status (October 2026)

- **Backend Pytest**: **199/199 tests passing** across 20 test files (including `test_calendar.py` with 5 integration tests covering CRUD, query filtering, stats aggregation, script/analysis relational linking, and fallback AI plan generation).
- **Frontend Vitest**: **215/215 tests passing** across 20 test files (including `calendar.test.tsx` with 20 tests covering date helpers, card variants, drag-and-drop rescheduling, Month/Week/Agenda views, search/filters, modals, and workspace integration).
- **TypeScript**: **0 errors** (`npx tsc --noEmit`).
- **Next.js Production Build**: **PASS** (15 static pages rendered).
