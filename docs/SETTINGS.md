# CINEHAI AI — Settings & Workspace Module

## Overview

The **Settings & Workspace** module (`/settings`) serves as the central control center for CINEHAI AI creators and filmmakers. It provides granular control over visual themes, AI model engine routing, Telugu regional language defaults, video aspect ratios, Caption Studio motion presets, privacy safeguards, and real-time backend diagnostics.

---

## Architecture & Layout

### 1. Responsive 2-Column Workspace
- **Desktop (>=1024px)**: 2-column layout with a sticky left navigation sidebar (displaying section icons, labels, and real-time badges) and a responsive right-hand settings pane.
- **Mobile (375px–768px)**: Horizontal scrollable tab strip with touch-optimized targets. Guaranteed zero horizontal page overflow.

### 2. Typed Client-Side Persistence Layer
All user preferences are strictly validated and managed through the `settingsStorage` module:
- **Key**: `cinehai_settings` in browser `localStorage`.
- **Schema Version**: `version: 1` with automatic migration hooks.
- **Fail-Safe Fallback**: Recovers gracefully from corrupted, missing, or malformed JSON payloads by falling back to `DEFAULT_APP_SETTINGS` without crashing the application.
- **Broadcasting**: Dispatches `cinehai_settings_changed` CustomEvents so other active tabs and studio components dynamically sync preferences without requiring a full reload.
- **Data Isolation Guarantee**: Factory reset and cache clearing operations specifically reset `cinehai_settings` while **preserving all creator profile persona data, saved screenplay scripts, video analyses, and database records intact**.

---

## The 8 Settings Sections

### 1. Studio Appearance
- **Studio Theme**:
  - `Cinema Dark` (Default obsidian palette for video editing)
  - `System Sync` (Adapts automatically to OS preference)
  - `Clean Light` (High-contrast neutral light mode)
- **Accessibility & Motion**:
  - `Reduced Motion Mode` toggle: Dampens kinetic caption pop-ins, heavy spring transitions, and 3D canvas rendering for motion sensitivity.
- **Interface Density**:
  - `Comfortable` (Roomy padding, larger touch targets)
  - `Compact` (Tighter table rows and trimmed margins for high-speed desktop workflows)

### 2. AI Engines & Zero-Leak Security
- **Configured AI Engine Cards**:
  - **Google Gemini 3.5 Flash Lite**: Primary LLM engine for hook generation, 2-column visual screenplays, retention drop-off heuristics, and hybrid Telugu speech restoration.
  - **Local Whisper (`base`)**: On-device neural speech recognition with genuine acoustic word-level timestamps and Apple Silicon Metal/CPU acceleration. Zero cloud cost or data egress.
  - **OpenAI Whisper Cloud**: Cloud fallback STT API for remote server instances.
  - **Offline Heuristic Mock Engine**: Deterministic simulated responses for offline testing without credentials.
- **Provider Routing Choices**:
  - Preferred LLM Provider (`gemini` vs `mock`).
  - Preferred Transcription Engine (`local_whisper` vs `production` vs `mock`).
  - Two-Stage Hybrid Telugu Restoration toggle: Restores colloquial/code-switched Whisper Telugu transcripts via Gemini 3.5 Flash Lite while preserving 1:1 segment timings.
- **Zero-Leak Security Guarantee**:
  - API keys, model tokens, and backend credentials remain strictly isolated on the backend server (`apps/api/.env`).
  - **Zero credentials or bearer tokens are ever exposed to the client DOM, bundled in JavaScript, or saved to `localStorage`**.

### 3. Language Profiles
- **Application Interface Language**: English (Default).
- **Caption Studio Default Language**:
  - `తెలుగు (Native Telugu)`: Native Telugu script rendered via Google Noto Sans Telugu with complete conjunct vowel shaping.
  - `Tanglish (Romanized Telugu)`: Telugu phonetic speech transcribed in Latin characters for high-energy social feeds.
  - `English`: Standard Latin script with word-level karaoke animation.
  - *Strict Rule*: Excludes non-target languages like Hindi from caption defaults.
- **Transcription Spoken Language**:
  - `Telugu (తెలుగు)` (Direct acoustic dictionary engagement)
  - `English`
  - `Auto-Detect Spoken Audio`

### 4. Video Canvas Defaults
- **Default Video Aspect Ratio**:
  - `9:16 Vertical` (Reels, Shorts, TikTok — Recommended)
  - `1:1 Square` (Feed posts)
  - `16:9 Landscape` (YouTube & Cinematic)
- **Centralized Server Upload Limit**:
  - Displays dynamic 100 MB upload limit badge synchronized with backend `MAX_VIDEO_SIZE_MB`.
- **Automated Video Analysis Toggles**:
  - Auto-run pacing & drop-off audits on ingestion.
  - Auto-detect 3-second visual hooks.
  - Auto-segment scene beats for screenplay reconstruction.

### 5. Caption Studio Motion Defaults
- **10 One-Click Motion Templates**:
  - Clean Classic, Hormozi Impact, Viral Pop, Karaoke Glow, Neon Cyber, Editorial Reel, Minimal Fade, Dynamic Pulse, Punch Accent, Cinematic Gold.
- **Default Target Script**: Telugu, Tanglish, English.
- **Free X/Y Positioning Sliders**:
  - Horizontal X position (0%–100%, default 50%).
  - Vertical Y position (0%–100%, default 82%).
  - Real-time 9:16 phone canvas simulator with safe-area boundary overlay.
- **Typography & Motion Intensity**:
  - Font sizes: Small (18px), Medium (24px), Large (32px), Extra Large (40px).
  - Motion intensity: Subtle, Normal, Punchy.
  - Safe-area guide overlay switch (guided vs unbounded).
- *Non-Destructive Notice*: Sets initial canvas defaults for new studio projects without altering existing working drafts or cues.

### 6. Privacy & Data Guarantees
- **Transparency Disclosures**:
  - *Transient Video Purge*: Uploaded MP4 videos are held in memory during FFmpeg extraction and automatically purged immediately after.
  - *Zero Cloud Voice Retention*: Local Whisper runs 100% on-device; no creator voice samples or audio waveforms are persisted to external cloud storage.
  - *Client-Side Isolation*: Settings reside solely in browser `localStorage`.
- **Session Controls**:
  - Toggle local working draft persistence.
  - Toggle local client telemetry logging.
- **Danger Zone Actions**:
  - *Clear Local Storage Cache*.
  - *Reset Settings to Factory Defaults*: Protected by an accessible `ConfirmationModal`.

### 7. System Diagnostics
- **Live Metric Cards**:
  - FastAPI Backend status (`healthy`, `version: 1.0.0`, `development`).
  - SQLite Database async pool state (`connected`).
  - Google Gemini configuration status (`gemini-3.5-flash-lite`).
  - Local Whisper availability (`base` model, on-device).
  - OpenAI Whisper Cloud readiness.
  - Centralized 100 MB video upload cap.
- **Run Diagnostics Action**:
  - Interactive probe measuring round-trip network and service latency.
  - Displays formatted timestamp of last inspection.
- **Telemetry Inspector**:
  - Collapsible sanitized JSON payload viewer for developer diagnostics.

### 8. About & Creator Attribution
- **Creator Persona Attribution**:
  - **Owner**: Sai Panga (Creator & Filmmaker).
  - **Purpose**: Tailored for cinematic storytelling, high-retention video architecture, and regional Telugu content production.
- **Active Authentic Product Modules**:
  1. Hook Generator
  2. Script Studio & Unified Script Ingestion
  3. Script Retention Analyzer
  4. Script Optimizer
  5. Caption Studio
  6. Video Analysis
  7. Creator Profile & Tone Memory
  8. Content Calendar
- **Technical Architecture**:
  - Next.js 14, React 18, TypeScript, Tailwind CSS, FastAPI, SQLite, faster-whisper, Google Gemini 3.5 Flash Lite, FFmpeg.

---

## Verification & Automated Testing

| Test Suite | File | Tests Passed | Status |
| :--- | :--- | :--- | :--- |
| **Settings Module Tests** | `apps/web/tests/settings.test.tsx` | 15 / 15 | **PASS** |
| **Full Web Test Suite** | `apps/web/tests/*.test.tsx` | 189 / 189 | **PASS** |
| **Full Backend Test Suite** | `apps/api/tests/*.py` | 189 / 189 | **PASS** |
| **TypeScript Typecheck** | `npx tsc --noEmit` | 0 errors | **PASS** |
| **Production Build** | `next build` | 15/15 static pages | **PASS** |
