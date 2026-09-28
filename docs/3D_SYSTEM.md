# CINEHA AI — 3D Animation & Visualization System

This document outlines the architecture, performance targets, and accessibility protocols of the 3D visualization system implemented with **Three.js**, **React Three Fiber (R3F)**, and **@react-three/drei**.

---

## 1. System Objectives

The 3D system is not merely cosmetic; it is an intuitive pedagogical tool designed to explain:
1. **Multi-Agent Orchestration Workflow:** Visualizes active data passing between the Orchestrator, Hook Agent, Script Agent, Reviewer, and Optimizer.
2. **Content Creation Pipeline:** Guides the creator through the mental shift from Idea $\rightarrow$ Script $\rightarrow$ Shooting $\rightarrow$ Publishing.
3. **Execution State Telemetry:** Reflects real agent states (`idle`, `processing`, `completed`, `error`) via dynamic shaders, node illumination, and particle pulses.

---

## 2. Component Architecture

```
apps/web/components/three/
├── WorkflowCanvas.tsx             # Root WebGL Canvas with camera & lighting
├── WorkflowScene.tsx              # Scene container with OrbitControls / Float
├── nodes/
│   ├── AgentNodeMesh.tsx          # 3D Node representing a distinct AI Agent
│   ├── ConnectionPulse.tsx        # Dynamic Bezier curve with flowing pulse particles
│   └── NodeStatusRing.tsx         # Orbiting luminous ring indicating agent state
├── pipeline/
│   ├── ContentPipeline3D.tsx      # 3D stages for idea-to-publish tracking
│   └── CameraStageRig.tsx         # Smooth focal shifts between active nodes
└── fallback/
    ├── Accessible2DWorkflow.tsx   # Semantic SVG/HTML equivalent for screen readers & low-spec
    └── ThreeCanvasErrorBoundary.tsx # Error boundary with automatic fallback swap
```

---

## 3. Shader & Visual State Logic

- **Idle State:** Cool slate glow (`#334155`), slow harmonic breathing pulse ($0.5\text{Hz}$).
- **Active / Processing State:** Radiant indigo-violet aura (`#6366F1` $\rightarrow$ `#A855F7`), accelerated particle emitter firing along the spline toward the next downstream node.
- **Success / Completed State:** Emerald beacon (`#10B981`) with static lock.
- **Error / Fault State:** Crimson warning pulse (`#EF4444`) with camera shake impulse.

---

## 4. Performance & Hardware Adaptation

1. **Lazy Loading:** 3D canvases are imported dynamically via `next/dynamic` with `ssr: false` to ensure zero hydration mismatch and minimal initial bundle size.
2. **Frame Budgeting:** Fixed pixel ratio clamped to `Math.min(window.devicePixelRatio, 2)` to avoid GPU strain on Retina screens.
3. **Frustum & Occlusion Culling:** Three.js objects outside the active view cone are automatically culled.
4. **Hardware Detection:** If WebGL 2 is unsupported or GPU initialization errors are caught, the component cleanly unmounts and renders the `Accessible2DWorkflow` without layout disruption.
5. **Reduced Motion:** Observes `@media (prefers-reduced-motion: reduce)`. When triggered, all particle loops and camera transitions are halted, rendering static highlighted nodes.
