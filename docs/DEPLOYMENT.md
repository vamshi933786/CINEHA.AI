# CINEHA AI — Production Deployment Guide

This guide details the dual-tier deployment topology separating the Next.js 14 frontend (Vercel) from the Python FastAPI backend (Render / Railway / AWS).

---

## 1. Architectural Topology

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

## 2. Frontend Deployment (Vercel)

### Root Directory & Build Configuration
- **Root Directory:** `apps/web`
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Node.js Version:** `20.x`

### Environment Variables on Vercel
```env
NEXT_PUBLIC_API_URL=https://api.cineha.ai/api/v1
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SITE_URL=https://cineha.vercel.app
```

---

## 3. Backend Deployment (Docker / Cloud Run / Railway / Render)

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

### Backend Environment Variables
```env
PORT=8000
ENVIRONMENT=production
ALLOWED_ORIGINS=https://cineha.vercel.app,http://localhost:3000
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/cineha_prod
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
MAX_UPLOAD_SIZE_MB=50
```

---

## 4. Pre-Flight Verification Checklist
1. Verify `npm run build` exits with code 0 in `apps/web`.
2. Verify all API routes return valid CORS headers for the Vercel domain.
3. Verify database migrations run cleanly (`alembic upgrade head`).
4. Test health check endpoint (`/api/v1/health`) in production container.
5. Verify WebGL 2 rendering on mobile Safari (iOS) and Chrome (Android).
