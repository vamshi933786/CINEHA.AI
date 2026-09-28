# CINEHA AI — Development Roadmap & Milestones

This roadmap structures the engineering execution into clear, reversible phases with verifiable verification gates at each step.

---

## Phase Matrix

| Phase | Milestone | Scope & Deliverables | Verification Gate |
|---|---|---|---|
| **Phase 0** | **Environment Inspection** | Verify node, npm, python, git, and local sandbox capabilities. | Environment audit complete & documented. |
| **Phase 1** | **Architectural Foundation & Docs** | Create specs, architecture diagrams, React pattern blueprints, and API contracts. | Architectural documents peer-reviewed and approved. |
| **Phase 2** | **Project Scaffolding & Setup** | Initialize monorepo structure, Next.js 14 frontend, FastAPI backend, and shared typings. | `GET /api/v1/health` returns 200; frontend loads with 0 errors. |
| **Phase 3** | **Design System & Shell Layout** | Implement responsive navigation, cinema-dark theme, compound UI primitives, and route shell. | Layout renders responsively on desktop, tablet, and mobile. |
| **Phase 4** | **Creator Profile & Persona Engine** | Profile management form, localStorage/DB persistence, and injection into agent prompts. | Profile data hydrates form and persists across sessions. |
| **Phase 5** | **Hook Generator & Classifier** | Multi-category hook engine (9 taxonomies), bilingual support (Telugu/English), copy/save features. | Unit test validates generation and classification schema. |
| **Phase 6** | **AI Script Generator & Workspace** | Compound component script workspace, 2-column screenplay view, export to TXT/MD/JSON. | Generates complete structured script with visual directions. |
| **Phase 7** | **Script Analyzer & Optimizer** | Heuristic retention audit, line-by-line critique, side-by-side diff comparison, and versioning. | Script analysis produces actionable scores and diffs. |
| **Phase 8** | **Multi-Agent Orchestrator Engine** | Async agent mesh, execution state machine, fallback handling, and mock/live LLM provider interface. | Orchestrator handles sequential and parallel agent runs. |
| **Phase 9** | **3D Workflow Visualizer** | Three.js / React Three Fiber interactive node graph with live pipeline state and accessible 2D fallback. | 3D canvas loads smoothly with 60 FPS and graceful fallback. |
| **Phase 10** | **Trend Research Assistant** | Niche pattern analyzer, source tracking, verified vs inferred flags. | Search returns structured trend reports with attribution. |
| **Phase 11** | **Multimodal Video Analysis & Video → Script Engine** | Dual pipeline: Local video upload (MP4/MOV/WEBM up to 100MB via `MAX_VIDEO_SIZE_MB=100`) & public YouTube/Instagram URL input. Produces dual outputs: Video Analysis Audit (metadata, hook, story, visual, audio, pacing, suitability) and Video → Script Reconstruction (transcript, visual actions, on-screen text, audio, timecodes). Dual-tab UI: `[ Upload Video ] [ Video URL ]` → `[ VIDEO ANALYSIS ] [ EXTRACTED SCRIPT ]`. | Video upload validates format/size (<100MB); returns both structured analysis and reconstructed screenplay. |
| **Phase 12** | **Content Calendar & Kanban** | Drag-and-drop planning board, lifecycle status tracking, and script linking. | Calendar events persist and link to generated scripts. |
| **Phase 13** | **Testing, Security & Hardening** | Frontend component tests, backend Pytest suite, security review, and performance optimizations. | All test suites passing; zero secret leakage detected. |
| **Phase 14** | **Deployment & Production Build** | Production build verification, Vercel configuration, Dockerfile, and deployment documentation. | `npm run build` passes; production bundle size within budgets. |

---

## Reversibility & Git Checkpoint Policy
- Every phase begins with a dedicated Git checkpoint commit or branch.
- Critical architectural changes are committed with semantic messages (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- In the event of regressions, Git reset or revert is executed using the documented checkpoints in `docs/DEVELOPMENT_LOG.md`.
