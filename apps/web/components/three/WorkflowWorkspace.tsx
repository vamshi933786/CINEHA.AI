"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useWorkflowState } from "../../hooks/useWorkflowState";
import { WorkflowControls } from "./WorkflowControls";
import { WorkflowNodeDetailPanel } from "./WorkflowNodeDetailPanel";
import { Accessible2DWorkflow } from "./Accessible2DWorkflow";
import { Info, Sparkles, Loader2 } from "lucide-react";

// Dynamically import Three.js Canvas with SSR disabled to prevent hydration mismatch
const DynamicWorkflowCanvas = dynamic(
  () => import("./WorkflowCanvas").then((mod) => mod.WorkflowCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] md:h-[620px] rounded-2xl bg-[#0f111a] border border-[#232738] flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
        <span className="text-xs font-mono">Loading 3D Visualizer...</span>
      </div>
    ),
  }
);

export const WorkflowWorkspace: React.FC = () => {
  const {
    nodes,
    connections,
    selectedNodeId,
    selectedNode,
    activePreset,
    globalStatus,
    viewMode,
    webglSupported,
    prefersReducedMotion,
    setSelectedNodeId,
    setViewMode,
    applyPreset,
  } = useWorkflowState();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Educational & Architectural Notice */}
      <div className="p-4 rounded-2xl bg-[#121422] border border-[#232738] shadow-lg flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="text-slate-300 font-medium">
            <strong>CINEHA AI Multi-Agent Pipeline:</strong> Visualizes the end-to-end orchestration flow from Creator Intent to Final Production-Ready Screenplay.
          </p>
          <p className="text-[11px] text-slate-400">
            Note: Current phases (Hooks, Script Studio, Retention Analyzer, Optimizer) execute synchronously via direct API endpoints. Continuous streaming telemetry will be bound upon deployment of the background multi-agent orchestrator.
          </p>
        </div>
      </div>

      {/* Workflow Controls Bar */}
      <WorkflowControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activePreset={activePreset}
        onPresetChange={applyPreset}
        globalStatus={globalStatus}
        webglSupported={webglSupported}
      />

      {/* Main Dual-Pane Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Stage Viewport (Col span 2 on Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === "3d" && webglSupported ? (
            <DynamicWorkflowCanvas
              nodes={nodes}
              connections={connections}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              reducedMotion={prefersReducedMotion}
            />
          ) : (
            <Accessible2DWorkflow
              nodes={nodes}
              connections={connections}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              reducedMotion={prefersReducedMotion}
            />
          )}

          {/* Quick Legend Bar */}
          <div className="p-3 rounded-xl bg-[#12131a] border border-[#232738] flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span>Idle / Standby</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Active Processing</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Completed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>Error / Alert</span>
              </span>
            </div>

            {prefersReducedMotion && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                Reduced Motion Active
              </span>
            )}
          </div>
        </div>

        {/* Node Inspection Detail Drawer (Col span 1) */}
        <div className="lg:col-span-1">
          <WorkflowNodeDetailPanel node={selectedNode} />
        </div>
      </div>
    </div>
  );
};
