"use client";

import React from "react";
import {
  WorkflowNodeData,
  WorkflowNodeId,
  WorkflowConnection,
} from "../../types/workflow";
import {
  User,
  Cpu,
  Search,
  Zap,
  FileText,
  Activity,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Clock,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";

interface Accessible2DWorkflowProps {
  nodes: Record<WorkflowNodeId, WorkflowNodeData>;
  connections: WorkflowConnection[];
  selectedNodeId: WorkflowNodeId | null;
  onSelectNode: (id: WorkflowNodeId) => void;
  reducedMotion?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Cpu,
  Search,
  Zap,
  FileText,
  Activity,
  Sparkles,
  CheckCircle,
};

export const Accessible2DWorkflow: React.FC<Accessible2DWorkflowProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  reducedMotion = false,
}) => {
  const nodeList = Object.values(nodes).sort((a, b) => a.order - b.order);

  const getStatusBadge = (status: WorkflowNodeData["status"]) => {
    switch (status) {
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
            <Loader2 className={`w-3 h-3 ${reducedMotion ? "" : "animate-spin"}`} />
            Processing
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
            <Check className="w-3 h-3" />
            Completed
          </span>
        );
      case "waiting":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 border border-amber-500/50 text-amber-300">
            <Clock className="w-3 h-3" />
            Waiting
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 border border-rose-500/50 text-rose-300">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      case "idle":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-400">
            Idle / Standby
          </span>
        );
    }
  };

  return (
    <div
      className="p-6 rounded-2xl bg-[#12131a] border border-[#232738] shadow-2xl"
      role="region"
      aria-label="Accessible 2D Workflow Representation"
    >
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#232738]">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            CINEHA AI Orchestration Pipeline
          </h3>
          <p className="text-xs text-slate-400">
            Linear step-by-step representation of the autonomous content generation pipeline
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#181a28] border border-[#262c3e] text-slate-400">
          6 Sequential Stages
        </span>
      </div>

      {/* Semantic Ordered List */}
      <ol
        className="space-y-4"
        aria-label="CINEHA AI Content Generation Workflow Pipeline"
      >
        {nodeList.map((node, index) => {
          const isSelected = selectedNodeId === node.id;
          const Icon = ICON_MAP[node.iconName] || Cpu;
          const isLast = index === nodeList.length - 1;

          return (
            <li key={node.id} className="relative">
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className="absolute left-6 top-12 bottom-0 w-0.5 -mb-4 bg-gradient-to-b from-[#2e344d] to-[#1c2033]"
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                onClick={() => onSelectNode(node.id)}
                aria-current={isSelected ? "step" : undefined}
                className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 ${
                  isSelected
                    ? "bg-[#181d2f] border-cyan-500/50 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30"
                    : "bg-[#161824] border-[#242838] hover:border-[#383f58] hover:bg-[#1a1d2d]"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  {/* Step Order Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-[#1e2235] text-slate-400 border-[#2d3248]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Stage {node.order} • {node.stageName}
                      </span>
                    </div>
                    <h4
                      className={`text-sm font-semibold transition ${
                        isSelected ? "text-cyan-200" : "text-white"
                      }`}
                    >
                      {node.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {node.description}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  {getStatusBadge(node.status)}
                  <span className="text-[11px] text-slate-500 font-mono">
                    {node.role}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
