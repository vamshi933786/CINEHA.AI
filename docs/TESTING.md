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

### B. Backend Unit & Integration Tests (Pytest + pytest-asyncio)
- **API Health:** Verifies `GET /api/v1/health` responds with HTTP 200 and valid JSON schema.
- **Agent Schema Validation:** Asserts that invalid LLM outputs trigger Pydantic `ValidationError` and engage fallback handlers.
- **Orchestrator Routing:** Tests full pipeline execution vs quick single-agent generation.
- **Video Analysis & Script Guardrails:** Asserts rejection of non-video MIME types (e.g. `.exe`, `.pdf`) and files exceeding size limit (>100MB enforced by `MAX_VIDEO_SIZE_MB=100`).
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
