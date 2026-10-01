# CINEHA AI — 3D Animation & Visualization System (Phase 8)

This document outlines the architecture, performance safeguards, accessibility protocols, and workflow state contracts of the 3D visualization system implemented with **Three.js**, **React Three Fiber (R3F)**, and **@react-three/drei**.

---

## 1. System Objectives

The 3D system serves as an intuitive, interactive pedagogical tool explaining the CINEHA AI multi-agent orchestration architecture:
1. **Multi-Agent Orchestration Workflow:** Visualizes the sequential data passing between User Request, Orchestrator, Research, Hook Generator, Review, and Final Output.
2. **Honest Execution State Telemetry:** Distinguishes between static architectural blueprint representation and live agent execution telemetry. Does not fake backend progress.
3. **Inclusive Accessibility Fallback:** Provides an accessible, semantic 2D HTML/SVG representation for screen readers, low-capability environments, WebGL failures, and reduced-motion users.

---

## 2. Component Architecture

Implemented under `apps/web/components/three/` and `apps/web/types/workflow.ts`:

```
apps/web/
├── types/
│   └── workflow.ts                    # Typed workflow state, node, and connection contracts
├── hooks/
│   └── useWorkflowState.ts            # Custom hook managing selection, presets, motion, and fallback
├── components/three/
│   ├── WorkflowCanvas.tsx             # Canvas wrapper with dpr limit, lighting & dynamic import
│   ├── WorkflowScene.tsx              # Scene with OrbitControls, lighting, nodes, and splines
│   ├── WorkflowNode.tsx               # 3D Node mesh with polyhedral cage, glowing core, status ring & HTML label
│   ├── WorkflowConnections.tsx        # Quadratic Bezier spline curves with traveling pulse packets
│   ├── WorkflowParticles.tsx          # Lightweight ambient background floating particles
│   ├── WorkflowNodeDetailPanel.tsx    # Responsive side/bottom inspector for agent contracts & artifacts
│   ├── WorkflowControls.tsx           # Toolbar with 3D/2D switch, presets, and status indicators
│   ├── Accessible2DWorkflow.tsx       # Semantic HTML <ol> fallback with status badges & ARIA attributes
│   ├── ThreeCanvasErrorBoundary.tsx   # React Error Boundary catching WebGL/Three.js context failures
│   ├── WorkflowWorkspace.tsx          # Top-level orchestrator container for /workflow
│   └── index.ts                       # Barrel export
└── app/workflow/
    └── page.tsx                       # Production Next.js route with PageHeader & Suspense
```

---

## 3. Workflow State & Node Model

### Supported Statuses
```typescript
type WorkflowNodeStatus = "idle" | "waiting" | "processing" | "completed" | "error";
```

### Primary Workflow Nodes
| Stage | ID | Name | Role | Primary Responsibility |
|---|---|---|---|---|
| 1 | `user_request` | **User Request** | Content Prompt & Creator Persona | Ingestion of topic, target platform, duration, and persona |
| 2 | `orchestrator` | **Orchestrator Agent** | System Brain & Delegation | Decomposes creative brief and dispatches subagents |
| 3 | `research` | **Research Agent** | Topic & Trend Intelligence | Pattern synthesis, competitor pacing & citations (Phase 10) |
| 4 | `hook` | **Hook Generator** | 0–3s Retention Architecture | 9-taxonomy psychological opening hooks (Phase 5) |
| 5 | `review` | **Retention Review** | 9-Dimension Retention Auditor | Content & hook retention audit, drop-off risks, recommendations |
| 6 | `final_output` | **Final Output** | Final Delivery Asset | Production content package, presentation copy & export |

---

## 4. Visual State & Shader Logic

- **Idle / Standby State:** Neutral slate wireframe (`#64748b`), subtle breathing float ($0.5\text{Hz}$).
- **Active / Processing State:** Radiant cyan core (`#06b6d4`), accelerated status ring rotation, and moving data packets traveling along downstream connection splines.
- **Completed State:** Emerald beacon (`#10b981`), static lock with high-contrast badge.
- **Waiting State:** Warm amber glow (`#f59e0b`), stationary waiting halo.
- **Error / Fault State:** Crimson warning pulse (`#ef4444`) with high-contrast error banner.

---

## 5. Performance Safeguards

1. **Lazy Loading / SSR Boundary:** `WorkflowCanvas` is dynamically imported with `next/dynamic` (`ssr: false`) to prevent hydration mismatches and minimize initial page bundle cost.
2. **Device Pixel Ratio Clamping:** `dpr={[1, 2]}` prevents excessive GPU fillrate strain on high-DPI displays.
3. **Lightweight Geometries:** Primitives use low-polygon geometries (octahedrons and low-segment spheres) with hardware-accelerated materials.
4. **Bounded OrbitControls:** Constrained min/max polar angles and distances prevent camera flipping or losing orientation.
5. **Particle Conservation:** Particle count capped at 90 points with single-buffer geometry.

---

## 6. Accessibility & WebGL Fallback Protocols

1. **Semantic HTML 2D Fallback:** `Accessible2DWorkflow.tsx` renders a semantic `<ol>` with `aria-label="CINEHA AI Content Generation Workflow Pipeline"`.
2. **Error Boundary Fallback:** `ThreeCanvasErrorBoundary.tsx` catches any WebGL context loss or Three.js runtime exception and seamlessly renders the 2D diagram without crashing.
3. **Reduced Motion (`prefers-reduced-motion`):** Automatically halts continuous camera rotation, node floating, ring spinning, and particle drift, rendering static highlighted nodes.
4. **Manual Switcher:** Users can toggle between "3D Stage" and "2D Diagram" at any time from the controls toolbar.

---

## 7. Current Telemetry Status & Future Multi-Agent Orchestrator Integration

- **Current Architecture:** Current AI capabilities (Hooks, Script Studio, Retention Analyzer, Optimizer) execute synchronously via discrete FastAPI endpoints.
- **Live Telemetry Flag:** The workflow visualizer explicitly sets `isLiveTelemetry: false` by default, presenting an honest architectural blueprint.
- **Pedagogical Presets:** Includes "Idle Blueprint" (real default), "Pipeline Demo" (interactive simulation), and "Alert Demo" (error recovery showcase).
- **Future Integration Point:** In Phase 9/11 (Multi-Agent System), WebSocket or SSE event streams will feed directly into `useWorkflowState` without modifying the 3D rendering components.
