"use client";

import React from "react";
import {
  WorkflowState,
} from "../../types/workflow";
import {
  Box,
  List,
  Play,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";

interface WorkflowControlsProps {
  viewMode: "3d" | "2d";
  onViewModeChange: (mode: "3d" | "2d") => void;
  activePreset: WorkflowState["activePreset"];
  onPresetChange: (preset: WorkflowState["activePreset"]) => void;
  globalStatus: WorkflowState["globalStatus"];
  webglSupported: boolean;
}

export const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  viewMode,
  onViewModeChange,
  activePreset,
  onPresetChange,
  globalStatus,
  webglSupported,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-[#12131a] border border-[#232738] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: View Mode Toggle (3D vs 2D) */}
      <div className="flex items-center gap-2">
        <div className="bg-[#181a28] p-1 rounded-xl border border-[#262c3e] flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewModeChange("3d")}
            disabled={!webglSupported}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === "3d"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            } ${!webglSupported ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Stage</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("2d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === "2d"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>2D Diagram</span>
          </button>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#181b2a] border border-[#262c3e] text-slate-400">
          Status:{" "}
          <strong
            className={`uppercase ${
              globalStatus === "running"
                ? "text-cyan-400"
                : globalStatus === "error"
                ? "text-rose-400"
                : "text-slate-300"
            }`}
          >
            {globalStatus}
          </strong>
        </span>
      </div>

      {/* Center / Right: Scenario Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-medium">Scenario:</span>

        {/* Blueprint (Idle Authentic State) */}
        <button
          type="button"
          onClick={() => onPresetChange("idle_blueprint")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activePreset === "idle_blueprint"
              ? "bg-[#1f2438] text-white border border-[#3b4260]"
              : "bg-[#161824] text-slate-400 hover:text-slate-200 border border-[#242838]"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Idle Blueprint</span>
        </button>

        {/* Sample Run (Educational Simulation) */}
        <button
          type="button"
          onClick={() => onPresetChange("sample_run")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activePreset === "sample_run"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "bg-[#161824] text-slate-400 hover:text-slate-200 border border-[#242838]"
          }`}
        >
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>Pipeline Demo</span>
        </button>

        {/* Diagnostic Alert Demo */}
        <button
          type="button"
          onClick={() => onPresetChange("error_case")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activePreset === "error_case"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "bg-[#161824] text-slate-400 hover:text-slate-200 border border-[#242838]"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Alert Demo</span>
        </button>
      </div>
    </div>
  );
};
