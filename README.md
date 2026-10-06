# CINEHA AI — Intelligent Content Creation Platform

[![Project Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/saipanga/cineha-ai)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com/)
[![React Three Fiber](https://img.shields.io/badge/Three.js-R3F-black.svg)](https://docs.pmnd.rs/react-three-fiber)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)

> **CINEHA AI** is an enterprise-grade, multi-agent AI assistant tailored for short-form video creators across Instagram Reels, TikTok, and YouTube Shorts. Connected to the **Cinehashoots** brand and directed by **Sai Panga**.

---

## 🚀 Key Features

1. **AI Content Idea Generator:** Uncover high-performing angles, content formats, and audience value propositions.
2. **Trend & Pattern Research Assistant:** In-depth thematic research distinguishing verified citations from inferred social patterns.
3. **9-Taxonomy Hook Generator:** Engineering high-retention 0–3 second opening hooks with visual choreography directions.
4. **Bilingual Script Studio:** Two-column screenplay generation (Voiceover + Visual/B-Roll) supporting English, Telugu, and Tenglish.
5. **Script Retention Analyzer:** Heuristic retention, pacing, and story structure evaluation with transparent scoring.
6. **Script Optimizer & Diff Studio:** Side-by-side visual diff comparisons, version history, and single-click reversion.
7. **Multimodal Video Audit:** Metadata and frame inspection offering actionable editing recommendations.
8. **Creator Persona Engine:** Tailors all generation parameters to match individual tone, editing speed, and branding goals.
9. **Content Calendar & Kanban:** End-to-end planning board tracking ideas from ideation to publishing.
10. **Interactive 3D Agent Mesh:** Real-time Three.js visualization of the multi-agent orchestration pipeline.

---

## 🏛️ System Architecture & Named React Patterns

- **Architecture:** Decoupled Next.js 14 frontend + asynchronous Python FastAPI microservices + multi-agent orchestration mesh.
- **Named React Patterns:**
  - Compound Components (`<ScriptWorkspace>`, `<WorkflowGraph>`)
  - Custom Hooks (`useScriptGeneration`, `useCreatorProfile`, `useWorkflowStatus`)
  - Provider Pattern (`CreatorProfileProvider`, `WorkflowProvider`, `ThemeProvider`)
  - Container-Presentational Pattern
  - State Reducer Pattern for complex multi-step pipelines
  - Error Boundaries with graceful degradation

---

## 🛠️ Running CINEHAI Locally (Standalone)

You can launch, monitor, and stop both the frontend and backend with a single command from the root folder. **Antigravity does not need to remain open** once services are launched.

### 1. Start Both Services
```bash
./start.sh
# or
npm run start:dev
```
- Starts the FastAPI backend on **`http://localhost:8000`**
- Starts the Next.js frontend on **`http://localhost:3000`**
- Verifies health checks automatically
- Runs detached in the background
- Includes duplicate-start protection

### 2. Check Service Status
```bash
./status.sh
# or
npm run status
```
Displays running status, PIDs, listening ports, and health check results.

### 3. Graceful Shutdown
```bash
./stop.sh
# or
npm run stop
```
Safely terminates only the CINEHAI AI processes using tracked PIDs.

### 4. Live Logs
Output from both servers is streamed to the `logs/` directory:
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

---

## 🔧 Manual / Individual Setup

### Prerequisites
- Node.js `v18+` (detected `v20.18.0`)
- Python `3.9+` (detected `3.9.6` / `3.14.6`)
- Git

### 1. Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```
Accessible at: **`http://localhost:3000`**

### 2. Backend Setup
```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Accessible at: **`http://localhost:8000`**  
Interactive API Docs (Swagger): **`http://localhost:8000/docs`**


---

## 📚 Project Documentation

- [Project Requirements](./PROJECT_REQUIREMENTS.md)
- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [Development Roadmap](./DEVELOPMENT_ROADMAP.md)
- [React Patterns Catalog](./docs/REACT_PATTERNS.md)
- [Multi-Agent Mesh Architecture](./docs/AI_AGENTS.md)
- [REST API Specification](./docs/API.md)
- [Database Schema & Migrations](./docs/DATABASE.md)
- [3D Visualization System](./docs/3D_SYSTEM.md)
- [Testing Strategy & Test Cases](./docs/TESTING.md)
- [Security & Privacy Guide](./docs/SECURITY.md)
- [Deployment Guide (Vercel + Cloud)](./docs/DEPLOYMENT.md)
- [Development Log & Checkpoints](./docs/DEVELOPMENT_LOG.md)
- [Troubleshooting & FAQ](./docs/TROUBLESHOOTING.md)

---

## 📄 License & Attribution
Proprietary & Confidential. Developed for **Sai Panga** and the **Cinehashoots** brand ecosystem.
