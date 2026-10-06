# CINEHA AI — Quality Assurance & Testing Strategy

This document establishes the testing protocols, unit test suites, integration checkpoints, and automated validation gates.

---

## 1. Test Suite Architecture

```
apps/
├── web/
│   └── tests/
│       ├── analyzer.test.tsx
│       ├── analyzerOptimizerWorkflow.test.tsx
│       ├── api.test.ts
│       ├── calendar.test.tsx
│       ├── captionCues.test.tsx
│       ├── captionLanguageProcessing.test.tsx
│       ├── captionMotion.test.tsx
│       ├── captionStudio.test.tsx
│       ├── captionStudioRendering.test.tsx
│       ├── captionTemplates.test.tsx
│       ├── components.test.tsx
│       ├── healthStatus.test.tsx
│       ├── hooks.test.tsx
│       ├── optimizer.test.tsx
│       ├── profile.test.tsx
│       ├── scripts.test.tsx
│       ├── settings.test.tsx
│       ├── unifiedScriptInput.test.tsx
│       ├── videoAnalysis.test.tsx
│       └── workflow.test.tsx
│
└── api/
    └── tests/
        ├── test_analyzer_optimizer_workflow.py
        ├── test_calendar.py
        ├── test_caption_cues.py
        ├── test_caption_renderer.py
        ├── test_caption_transcription.py
        ├── test_config_and_cors.py
        ├── test_gemini_provider.py
        ├── test_health.py
        ├── test_hook_agent.py
        ├── test_hybrid_speech_restoration.py
        ├── test_language_processing.py
        ├── test_local_whisper_transcription.py
        ├── test_production_transcription.py
        ├── test_profile.py
        ├── test_real_speech_transcription.py
        ├── test_retention_analyzer.py
        ├── test_script_agent.py
        ├── test_script_optimizer.py
        ├── test_security_audit.py
        ├── test_unified_script_input.py
        └── test_video_analysis.py
```

---

## 2. Test Suites & Coverage Targets

### A. Frontend Unit & Component Tests (Vitest + React Testing Library)
- **20 test suites, 216 tests passing.**
- **Cross-Module Handoffs:** Verifies seamless state and payload transfer between Creator Profile, Hook Generator, Script Studio, Retention Analyzer, Optimizer, Video Analysis, Caption Studio, and Content Calendar.
- **Zero Secret Exposure:** Validates that settings workspaces, API clients, and telemetry logs contain zero plaintext API keys or private variables.
- **Accessibility & ARIA:** Verifies all buttons, inputs, sliders, and tab navigation satisfy keyboard navigability.

### B. Backend Security & Integration Tests (Pytest + pytest-asyncio)
- **21 test suites, 210 tests passing.**
- **Security Audit Regression Suite (`test_security_audit.py`):**
  1. `test_security_filename_sanitization_path_traversal`: POSIX, Windows backslashes, null bytes, and control characters sanitized safely.
  2. `test_security_validate_video_upload_safety`: Empty files (400), oversized files (413), bad extensions (415), invalid magic bytes (400) rejected.
  3. `test_security_docx_decompression_bomb_prevention`: Rejects zip archives with uncompressed entries exceeding 25MB threshold before decompression.
  4. `test_security_docx_xml_entity_injection_prevention`: Rejects DOCX XML containing `<!DOCTYPE` or `<!ENTITY` declarations.
  5. `test_security_prompt_injection_delimiters`: Verifies prompt templates enclose untrusted transcripts in `<transcript>` tags with explicit anti-injection directives.
  6. `test_security_cors_configuration`: Verifies default CORS origins never fall back to wildcard `*`, and wildcard disables credentials.
  7. `test_security_cors_disallows_unauthorized_origin`: Verifies unauthorized origins do not receive `Access-Control-Allow-Origin`.
  8. `test_security_secret_non_exposure_in_responses`: Verifies health and info endpoints do not leak API keys or database connection strings.
  9. `test_security_global_exception_handler_masking`: Verifies unhandled 500 errors return sanitized generic message without leaking paths or traces.
  10. `test_security_input_length_limits`: Verifies Pydantic models reject oversized text to prevent memory/storage exhaustion.
  11. `test_security_invalid_render_id_path_traversal`: Verifies path traversal sequences in download IDs are rejected with 400.

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

### Typecheck & Production Build
```bash
cd apps/web
npx tsc --noEmit
npm run build
```

---

## 4. Current Test Suite Status (October 2026)

- **Backend Pytest**: **210/210 tests passing** across 21 test files.
- **Frontend Vitest**: **216/216 tests passing** across 20 test files.
- **TypeScript**: **0 errors** (`npx tsc --noEmit`).
- **Next.js Production Build**: **PASS** (15 static pages rendered).
