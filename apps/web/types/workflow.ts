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
  | "script"
  | "review"
  | "optimizer"
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
    position3D: [-7, 0, 0],
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
    position3D: [-5, 1.2, 0],
    color: "#8b5cf6",
    accentGlow: "#a855f7",
    iconName: "Cpu",
    inputArtifacts: ["Normalized Ingestion Payload"],
    outputArtifacts: ["Agent Task Graph", "Execution Context"],
    telemetryNotes: "Central dispatcher coordinating Research, Hook, and Script agents.",
  },
  research: {
    id: "research",
    name: "Research Agent",
    stageName: "Topic & Trend Intelligence",
    role: "Data & Pattern Synthesizer",
    description: "Explores viral formats, platform hashtags, competitor pacing benchmarks, and audience pain points.",
    order: 3,
    status: "idle",
    position3D: [-3, -1.2, 0],
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
    position3D: [-1, 1.2, 0],
    color: "#f59e0b",
    accentGlow: "#fbbf24",
    iconName: "Zap",
    inputArtifacts: ["Trend Brief", "Creator Persona"],
    outputArtifacts: ["3–5 High-Retention Hooks"],
    telemetryNotes: "Powered by Phase 5 Hook Generator (`POST /api/v1/hooks/generate`).",
  },
  script: {
    id: "script",
    name: "Script Studio Agent",
    stageName: "2-Column Screenplay Generation",
    role: "Screenplay Choreographer",
    description: "Generates multi-beat video script balancing voiceover, visual cues, B-roll, on-screen text, and audio.",
    order: 5,
    status: "idle",
    position3D: [1, -1.2, 0],
    color: "#3b82f6",
    accentGlow: "#60a5fa",
    iconName: "FileText",
    inputArtifacts: ["Selected Hook", "Video Duration", "Pacing Template"],
    outputArtifacts: ["2-Column Screenplay Object", "Beat Timelines"],
    telemetryNotes: "Powered by Phase 6 Script Studio (`POST /api/v1/scripts/generate`).",
  },
  review: {
    id: "review",
    name: "Retention Analyzer",
    stageName: "Diagnostic Evaluation",
    role: "9-Dimension Retention Auditor",
    description: "Audits screenplay against 9 psychological criteria, word velocity (wps), filler phrases, and drop-off risks.",
    order: 6,
    status: "idle",
    position3D: [3, 1.2, 0],
    color: "#10b981",
    accentGlow: "#34d399",
    iconName: "Activity",
    inputArtifacts: ["Generated Screenplay"],
    outputArtifacts: ["Overall Retention Score (0–100)", "Weak Points", "Recommendations"],
    telemetryNotes: "Powered by Phase 7A Retention Analyzer (`POST /api/v1/scripts/{id}/analyze`).",
  },
  optimizer: {
    id: "optimizer",
    name: "Script Optimizer",
    stageName: "Iterative Refinement",
    role: "Retention & Pacing Rewriter",
    description: "Applies 6 targeted retention goals (Hook, Pacing, Filler, Curiosity, CTA) and creates new immutable versions.",
    order: 7,
    status: "idle",
    position3D: [5, -1.2, 0],
    color: "#ec4899",
    accentGlow: "#f472b6",
    iconName: "Sparkles",
    inputArtifacts: ["Retention Audit", "Creator Optimization Goals"],
    outputArtifacts: ["Optimized Screenplay", "Audit Trail", "Immutable ScriptVersion"],
    telemetryNotes: "Powered by Phase 7B Script Optimizer (`POST /api/v1/scripts/{id}/optimize`).",
  },
  final_output: {
    id: "final_output",
    name: "Production Ready Screenplay",
    stageName: "Creator Export",
    role: "Final Delivery Asset",
    description: "Ready-to-record screenplay package with teleprompter copy, visual storyboard references, and timing.",
    order: 8,
    status: "idle",
    position3D: [7, 0, 0],
    color: "#a855f7",
    accentGlow: "#c084fc",
    iconName: "CheckCircle",
    inputArtifacts: ["Optimized Script Version"],
    outputArtifacts: ["TXT / PDF Screenplay", "Production Timeline"],
    telemetryNotes: "Delivered to creator dashboard for recording & production.",
  },
};

export const DEFAULT_WORKFLOW_CONNECTIONS: WorkflowConnection[] = [
  { id: "c1", from: "user_request", to: "orchestrator", label: "Submit Brief", active: false },
  { id: "c2", from: "orchestrator", to: "research", label: "Delegate Insights", active: false },
  { id: "c3", from: "research", to: "hook", label: "Trend Patterns", active: false },
  { id: "c4", from: "hook", to: "script", label: "Selected Hook", active: false },
  { id: "c5", from: "script", to: "review", label: "Draft Screenplay", active: false },
  { id: "c6", from: "review", to: "optimizer", label: "Retention Weak Points", active: false },
  { id: "c7", from: "optimizer", to: "final_output", label: "Approved Screenplay", active: false },
];
