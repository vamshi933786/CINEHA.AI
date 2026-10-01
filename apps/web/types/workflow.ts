/**
 * CINEHA AI — Workflow State & Node Contracts
 * Phase 8: 3D Workflow Visualization
 */

export type WorkflowNodeStatus =
  | "idle"
  | "waiting"
  | "processing"
  | "completed"
  | "error";

export type WorkflowNodeId =
  | "user_request"
  | "orchestrator"
  | "research"
  | "hook"
  | "review"
  | "final_output";

export interface WorkflowNodeMetric {
  latencyMs?: number;
  tokensUsed?: number;
  confidenceScore?: number;
  itemsProcessed?: number;
}

export interface WorkflowNodeData {
  id: WorkflowNodeId;
  name: string;
  stageName: string;
  role: string;
  description: string;
  order: number;
  status: WorkflowNodeStatus;
  position3D: [number, number, number];
  color: string;
  accentGlow: string;
  iconName: string;
  inputArtifacts: string[];
  outputArtifacts: string[];
  telemetryNotes: string;
  metrics?: WorkflowNodeMetric;
}

export interface WorkflowConnection {
  id: string;
  from: WorkflowNodeId;
  to: WorkflowNodeId;
  label: string;
  active: boolean;
}

export interface WorkflowState {
  nodes: Record<WorkflowNodeId, WorkflowNodeData>;
  connections: WorkflowConnection[];
  activeNodeId: WorkflowNodeId | null;
  selectedNodeId: WorkflowNodeId | null;
  globalStatus: "idle" | "running" | "completed" | "error";
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  isLiveTelemetry: boolean;
  activePreset: "idle_blueprint" | "sample_run" | "error_case";
}

/**
 * Default architectural blueprint of CINEHA AI multi-agent workflow
 */
export const DEFAULT_WORKFLOW_NODES: Record<WorkflowNodeId, WorkflowNodeData> = {
  user_request: {
    id: "user_request",
    name: "User Request",
    stageName: "Input Ingestion",
    role: "Content Prompt & Creator Persona",
    description: "Captures creator intent, target platform (Reels/TikTok/Shorts), duration, and persona tone.",
    order: 1,
    status: "idle",
    position3D: [-6, 0, 0],
    color: "#64748b",
    accentGlow: "#94a3b8",
    iconName: "User",
    inputArtifacts: ["Creator Brief", "Persona Settings", "Duration Target"],
    outputArtifacts: ["Normalized Ingestion Payload"],
    telemetryNotes: "Synchronous client submission via UI inputs or API payloads.",
  },
  orchestrator: {
    id: "orchestrator",
    name: "Orchestrator Agent",
    stageName: "Workflow Coordination",
    role: "System Brain & Delegation",
    description: "Decomposes user creative goal into discrete subagent tasks, assigns context, and manages lifecycle.",
    order: 2,
    status: "idle",
    position3D: [-3.6, 1.2, 0],
    color: "#8b5cf6",
    accentGlow: "#a855f7",
    iconName: "Cpu",
    inputArtifacts: ["Normalized Ingestion Payload"],
    outputArtifacts: ["Agent Task Graph", "Execution Context"],
    telemetryNotes: "Central dispatcher coordinating Research, Hook, and Review agents.",
  },
  research: {
    id: "research",
    name: "Research Agent",
    stageName: "Topic & Trend Intelligence",
    role: "Data & Pattern Synthesizer",
    description: "Explores viral formats, platform hashtags, competitor pacing benchmarks, and audience pain points.",
    order: 3,
    status: "idle",
    position3D: [-1.2, -1.2, 0],
    color: "#06b6d4",
    accentGlow: "#22d3ee",
    iconName: "Search",
    inputArtifacts: ["Topic Concept", "Creator Niche"],
    outputArtifacts: ["Trend Citations", "Audience Hooks Database"],
    telemetryNotes: "Phase 10 Trend Engine integration point.",
  },
  hook: {
    id: "hook",
    name: "Hook Generator",
    stageName: "0–3s Retention Architecture",
    role: "9-Taxonomy Opening Specialist",
    description: "Synthesizes Curiosity, Contrarian, Problem-Solution, and Storytelling openings tailored to persona.",
    order: 4,
    status: "idle",
    position3D: [1.2, 1.2, 0],
    color: "#f59e0b",
    accentGlow: "#fbbf24",
    iconName: "Zap",
    inputArtifacts: ["Trend Brief", "Creator Persona"],
    outputArtifacts: ["3–5 High-Retention Hooks"],
    telemetryNotes: "Powered by Phase 5 Hook Generator (`POST /api/v1/hooks/generate`).",
  },
  review: {
    id: "review",
    name: "Retention Review",
    stageName: "Diagnostic Review",
    role: "9-Dimension Retention Auditor",
    description: "Audits content and opening hooks against psychological retention criteria, pacing velocity, and audience drop-off risks.",
    order: 5,
    status: "idle",
    position3D: [3.6, -1.2, 0],
    color: "#10b981",
    accentGlow: "#34d399",
    iconName: "Activity",
    inputArtifacts: ["Candidate Hooks", "Creative Context"],
    outputArtifacts: ["Overall Retention Score (0–100)", "Weak Points", "Approved Review"],
    telemetryNotes: "Powered by Retention Analyzer diagnostic engine (`POST /api/v1/scripts/{id}/analyze`).",
  },
  final_output: {
    id: "final_output",
    name: "Final Output",
    stageName: "Creator Export",
    role: "Final Delivery Asset",
    description: "Production-ready content package with verified hooks, timing benchmarks, and presentation copy.",
    order: 6,
    status: "idle",
    position3D: [6, 0, 0],
    color: "#a855f7",
    accentGlow: "#c084fc",
    iconName: "CheckCircle",
    inputArtifacts: ["Approved Review Package"],
    outputArtifacts: ["Production Asset Package", "Delivery Brief"],
    telemetryNotes: "Delivered to creator dashboard for recording & production.",
  },
};

export const DEFAULT_WORKFLOW_CONNECTIONS: WorkflowConnection[] = [
  { id: "c1", from: "user_request", to: "orchestrator", label: "Submit Brief", active: false },
  { id: "c2", from: "orchestrator", to: "research", label: "Delegate Insights", active: false },
  { id: "c3", from: "research", to: "hook", label: "Trend Patterns", active: false },
  { id: "c4", from: "hook", to: "review", label: "Selected Hook", active: false },
  { id: "c5", from: "review", to: "final_output", label: "Approved Review", active: false },
];
