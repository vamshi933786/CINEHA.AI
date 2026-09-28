# CINEHA AI — Project Requirements Document

## 1. Executive Summary & Brand Identity
- **Project Name:** CINEHA AI
- **Tagline:** Your Intelligent Content Creation Assistant
- **Category:** AI-Powered Multi-Agent Content Creation Platform for Short-Form Video (Reels, TikTok, Shorts)
- **Primary Users:** Instagram Reels creators, TikTok creators, YouTube Shorts creators, video editors, filmmakers, personal brands, freelancers, and social media agencies.
- **Project Owner:** Sai Panga
- **Brand Context:** Connected to the **Cinehashoots** content creation brand.
- **Vision:** Empower creators to move seamlessly through the complete creative workflow:
  $$\text{IDEA} \longrightarrow \text{RESEARCH} \longrightarrow \text{HOOK} \longrightarrow \text{SCRIPT} \longrightarrow \text{REVIEW} \longrightarrow \text{OPTIMIZATION} \longrightarrow \text{CONTENT PLAN}$$

---

## 2. Core Functional Modules

### Module 1: AI Content Idea Generator
- **Inputs:** Topic/theme, niche, platform (Reels, TikTok, Shorts), target audience, content goal (educate, entertain, sell, inspire), language, format (story, listicle, breakdown, skit).
- **Outputs:** Content title, content angle, target audience alignment, hook direction, main value proposition, suggested format, potential CTA, research leads.
- **Constraints:** Factual verification flags; no hallucinated trend statistics.

### Module 2: Trend & Pattern Research Assistant
- **Inputs:** Platform selection, niche, topic search query, time range.
- **Outputs:** Verified themes, inferred short-form video patterns, hook frequency analysis, structured source tracking, verified vs inferred flags.
- **Constraints:** Explicitly distinguishes verified data vs inferred patterns; handles platform API rate limits gracefully with transparent status.

### Module 3: Hook Generator & Classifier
- **Hook Taxonomies:** Curiosity, Question, Problem-Solution, Storytelling, Contrarian, Demonstration, Educational, Visual, Personal Experience.
- **Inputs:** Topic, target audience, platform, language (Telugu, English, Telugu+English "Tenglish"), tone, quantity.
- **Outputs:** Hook text, hook category, audience focus, suggested visual opening, vocal delivery style, psychological rationale.
- **Ethics:** Prohibits copying existing creator scripts; no "guaranteed viral" false claims.

### Module 4: AI Script Generator
- **Supported Formats:** Educational, Storytelling, Tutorial, Entertainment, Product Promotion, Personal Branding, Review, Cinematic Short, Documentary-Style Short.
- **Supported Languages:** English, Telugu, Telugu + English (bilingual code-switching), extensible for others.
- **Structure:** Title, Opening Hook, Introduction, Core Value/Main Content, Examples/Proof, Transition, Call to Action (CTA).
- **Metadata:** Two-column format (Voiceover + Visual/B-Roll Directions), text overlays, sound design cues, estimated duration (clearly marked as estimated).

### Module 5: Script Analyzer
- **Inputs:** Raw creator script, target platform, duration target, target audience, goal.
- **Analysis Metrics:** Hook strength & retention potential, structural flow, pacing & word count velocity, repetition/filler detection, clarity score, audience relevance, CTA strength, weak beat identification.
- **Output:** Transparent heuristic scores (clearly explained as heuristic, not predictive virality), specific line-by-line feedback, strengths, and revision paths.

### Module 6: Script Optimizer & Diff Versioning
- **Inputs:** Script + analysis critique + user revision goals (tighten pacing, punch up hook, translate/re-tone).
- **Outputs:** Side-by-side visual diff comparison, preserved core idea, alternate hooks, revised CTA, revision history with one-click restore.

### Module 7: Multimodal Video Analysis
- **Inputs:** Video upload (MP4, MOV; validated file sizes and mime-types).
- **Processing:** Metadata extraction (resolution, framerate, duration, bitrate), audio stream analysis, keyframe extraction (opening 3-second hook frame, mid-scene transitions).
- **Analysis:** Visual composition, scene pacing, audio clarity, caption readability, storytelling retention, actionable editing feedback.
- **Cleanup:** Strict transient storage policy — automatic purge of scratch video files after processing.

### Module 8: Creator Profile & Persona Engine
- **Fields:** Creator name, brand name, primary niche, target demographic, platforms, content style, primary language, tone profile, CTA style, editing rhythm, experience level.
- **Integration:** Injected into prompt templates and multi-agent context so generations reflect creator tone consistently.

### Module 9: Content Calendar & Kanban Planner
- **Views:** Monthly calendar, weekly timeline, Kanban stage board.
- **Lifecycle Stages:** `Idea` $\rightarrow$ `Researching` $\rightarrow$ `Scripted` $\rightarrow$ `Recording` $\rightarrow$ `Editing` $\rightarrow$ `Scheduled` $\rightarrow$ `Published`.
- **Features:** Direct link to generated script IDs, drag-and-drop status update, platform tags, publishing date reminders.

### Module 10: Script History & Version Control
- **Features:** Full version tree per script, fork/duplicate script, search & filter by niche/platform/language, diff view, JSON/Markdown export.

### Module 11: Real-Time Multi-Agent Workflow Visualizer
- **Visual Nodes:** Orchestrator $\rightarrow$ Research Agent $\rightarrow$ Hook Agent $\rightarrow$ Script Agent $\rightarrow$ Review Agent $\rightarrow$ Optimizer.
- **State Fidelity:** Real status reflection (`idle`, `queued`, `active`, `completed`, `failed`), displaying token usage, latency, and step payload.

---

## 3. Mandatory Mentor Standards Matrix

| Requirement | Implementation Strategy |
|---|---|
| **1. Multi-layered Complexity** | Presentation (Next.js 14 App Router) $\rightarrow$ State/Hooks $\rightarrow$ Orchestration Client $\rightarrow$ FastAPI Backend $\rightarrow$ Multi-Agent Domain Services $\rightarrow$ SQLite/PostgreSQL Repository Layer. |
| **2. Named React Design Patterns** | Documented in `docs/REACT_PATTERNS.md`: Compound Components, Custom Hooks, Provider Pattern, Container-Presentational, State Reducer, Error Boundary. |
| **3. Project Repository Structure** | Clean monorepo (`apps/web`, `apps/api`, `packages/shared-types`, `docs/`, `scripts/`). |
| **4. Reversible Development** | Git version control, feature branches, semantic commits, documented recovery checkpoints in `docs/DEVELOPMENT_LOG.md`. |
| **5. 3D Visualizations** | Three.js + React Three Fiber interactive agent workflow node graph with fallback 2D accessible graph for mobile/reduced-motion. |
| **6. Cross-Device Responsiveness** | Tailwind responsive breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`), touch targets $\ge 44\text{px}$, drawer navigation on mobile, adaptive canvas. |
| **7. Multi-page Architecture** | 10+ distinct route segments: `/`, `/dashboard`, `/scripts`, `/hooks`, `/research`, `/analyzer`, `/optimizer`, `/video-analysis`, `/calendar`, `/profile`, `/settings`. |
| **8. Vercel & Cloud Deployment** | Frontend optimized for Vercel deployment with SSR/Edge caching; backend structured for containerized/Render/Railway deployment. |
| **9. Localhost Development** | Frontend on `http://localhost:3000`, Backend FastAPI on `http://localhost:8000`, interactive Swagger on `http://localhost:8000/docs`. |
| **10. Professional Documentation** | 14 dedicated documentation files covering architecture, patterns, APIs, database, agents, security, and testing. |
