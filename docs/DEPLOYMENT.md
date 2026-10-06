# CINEHA AI — Production Deployment Guide & Operational Boundaries

This guide details the dual-tier deployment topology separating the Next.js 14 frontend from the Python FastAPI backend, and formalizes operational readiness boundaries.

---

## 1. Operational Deployment Boundaries

| Deployment Target | Status | Requirements & Notes |
| :--- | :--- | :--- |
| **Local Workstation** | **SAFE & READY** | Default single-creator mode. Runs on `localhost:3000` with local SQLite, Local Whisper, and optional Gemini LLM. |
| **Controlled Staging / Demo** | **SAFE & READY** | Single-tenant demo behind password-protected reverse proxy or VPN. |
| **Public Multi-User Production** | **REQUIRES HARDENING** | **Requires Authentication & Tenant Isolation prior to public exposure.** |

> [!WARNING]
> **Prerequisites for Public Multi-User Deployment:**
> 1. **Authentication Layer:** Implement user authentication (OAuth2 / OIDC / Supabase Auth / Clerk) to associate records with specific user IDs.
> 2. **Tenant Isolation:** Add `user_id` foreign keys to `CreatorProfile`, `Script`, `ContentItem`, and `VideoAnalysis` tables to prevent cross-creator access.
> 3. **Object Storage:** Replace local temporary render cache with S3/GCS signed URLs for rendered captioned MP4 downloads.
> 4. **Edge Rate Limiting:** Enforce per-user token-bucket rate limits on expensive multimodal endpoints (`/video-analysis/analyze`, `/captions/render`).

---

## 2. Architectural Topology

```
+--------------------------------------------------------+
|                     User Browser                       |
+---------------------------+----------------------------+
                            |
           +----------------+----------------+
           |                                 |
           v                                 v
+-----------------------+         +----------------------+
|  Vercel Edge Network  |         |   Cloud Container    |
|   (Next.js 14 App)    |         | (FastAPI + FFmpeg)   |
|   cineha.vercel.app   |         | api.cineha.ai        |
+-----------+-----------+         +----------+-----------+
            |                                |
            |      REST / SSE Streaming      |
            +--------------------------------+
                                             |
                                  +----------+----------+
                                  |                     |
                                  v                     v
                        +-------------------+ +-------------------+
                        |   Supabase / AWS  | |  AI Provider API  |
                        |  PostgreSQL 15+   | |  (Gemini/OpenAI)  |
                        +-------------------+ +-------------------+
```

---

## 3. Frontend Deployment (Vercel)

### Root Directory & Build Configuration
- **Root Directory:** `apps/web`
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Node.js Version:** `20.x`

### Environment Variables on Vercel
```env
NEXT_PUBLIC_API_URL=https://api.cineha.ai/api/v1
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_NAME="CINEHA AI"
```

---

## 4. Backend Deployment (Docker / Cloud Run / Railway / Render)

### Dockerfile (`apps/api/Dockerfile`)
```dockerfile
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Backend Production Environment Variables
```env
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=production
ALLOWED_ORIGINS=https://cineha.vercel.app,http://localhost:3000
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/cineha_prod
MAX_VIDEO_SIZE_MB=100
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_API_KEY=your_gemini_api_key_here
TRANSCRIPTION_PROVIDER=local_whisper
LOCAL_WHISPER_MODEL=base
ENABLE_HYBRID_SPEECH_RESTORATION=true
```

---

## 5. Pre-Flight Verification Checklist
1. Verify `npm run build` exits with code 0 in `apps/web`.
2. Verify `pytest apps/api/tests` exits with code 0 (210/210 tests pass).
3. Verify all API routes return valid CORS headers for the configured domain.
4. Verify database connectivity and schema migrations initialize cleanly on startup.
5. Verify FFmpeg 7.x+ binary is detected and operational for audio demuxing and caption rendering.
