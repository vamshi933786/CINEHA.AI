# CINEHA AI — Security & Privacy Architecture

This document formalizes the security controls, boundary enforcement, and privacy practices protecting user data and operational integrity.

---

## 1. Secret Protection & Environment Isolation
- **No Hardcoded Secrets:** Zero API keys, database credentials, or secret keys are committed to Git.
- **Client Bundle Isolation:** Next.js environment variables are isolated; only variables prefixed with `NEXT_PUBLIC_` are bundled to the browser. Backend AI provider keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) remain strictly server-side.
- **Log Masking:** Middleware intercepts request/response telemetry and masks authorization headers, tokens, and PII before logging.

---

## 2. Input Sanitization & Prompt Injection Mitigation
- **Length Caps:** Form topics capped at 500 characters; script paste analyzer capped at 10,000 characters.
- **Prompt Injection Shields:** User inputs are bound strictly as data payloads inside delimiters (e.g. `"""USER_CONTENT"""`) in agent prompt templates; instructions to ignore previous system instructions are filtered out.
- **Type Checking:** Pydantic models reject unexpected fields or malformed payloads before execution reaches domain services.

---

## 3. Video Upload Sandbox & Transient Lifecycle
- **Strict MIME & Magic Byte Validation:** File headers are verified for valid MP4 (`ftyp` box), QuickTime MOV, or WEBM (`1A 45 DF A3` EBML) signatures; invalid or spoofed extensions are rejected.
- **Size Limitation:** 100 MB ceiling enforced via reverse proxy and FastAPI middleware using the configurable `MAX_VIDEO_SIZE_MB=100` setting.
- **URL Compliance Guardrails:** URL inputs are restricted to public YouTube and Instagram links. The service strictly abides by platform access terms and does not attempt credential bypass, private account scrapping, or DRM evasion.
- **Immediate File Purge:** Uploaded or downloaded video files are saved to an isolated temporary scratch folder (`/tmp/cineha_uploads/`), processed for frame metadata and transcription, and unlinked (`os.remove()`) immediately inside a `finally:` block. No raw video files remain stored on disk.

---

## 4. Network Security & CORS
- **CORS Allowlist:** Strictly limited to `http://localhost:3000` in development and the verified production Vercel domain.
- **Rate Limiting:** IP-based token-bucket limiter restricting intensive AI generation endpoints to 20 requests per minute per IP address.
- **HTTPS Enforcement:** Mandatory TLS 1.3 in production environments.
