"use client";

import React from "react";
import Link from "next/link";
import {
  WorkflowNodeData,
  WorkflowNodeStatus,
} from "../../types/workflow";
import {
  Cpu,
  Layers,
  ArrowRight,
  Terminal,
  Activity,
  Zap,
  FileText,
  Sparkles,
  Search,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface WorkflowNodeDetailPanelProps {
  node: WorkflowNodeData | null;
}

export const WorkflowNodeDetailPanel: React.FC<WorkflowNodeDetailPanelProps> = ({
  node,
}) => {
  if (!node) {
    return (
      <div className="p-6 rounded-2xl bg-[#12131a] border border-[#232738] text-center text-slate-500 text-xs">
        Select a node in the workflow canvas or diagram to inspect its agent role and input/output contracts.
      </div>
    );
  }

  const getToolLink = (id: string) => {
    switch (id) {
      case "user_request":
        return { label: "Creator Profile", href: "/profile" };
      case "hook":
        return { label: "Hook Generator", href: "/hooks" };
      case "review":
        return { label: "Retention Analyzer", href: "/analyzer" };
      case "research":
        return { label: "Trend Research", href: "/research" };
      default:
        return null;
    }
  };

  const toolLink = getToolLink(node.id);

  const getStatusColor = (status: WorkflowNodeStatus) => {
    switch (status) {
      case "processing":
        return "text-cyan-400 bg-cyan-950/80 border-cyan-500/50";
      case "completed":
        return "text-emerald-400 bg-emerald-950/80 border-emerald-500/50";
      case "waiting":
        return "text-amber-400 bg-amber-950/80 border-amber-500/50";
      case "error":
        return "text-rose-400 bg-rose-950/80 border-rose-500/50";
      case "idle":
      default:
        return "text-slate-400 bg-slate-800/80 border-slate-700";
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#12131a] border border-[#232738] shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#232738]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-0.5">
            Stage {node.order} • {node.stageName}
          </span>
          <h3 className="text-base font-bold text-white tracking-tight">
            {node.name}
          </h3>
          <p className="text-xs text-cyan-300 font-medium mt-0.5">
            {node.role}
          </p>
        </div>

        <span
          className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusColor(
            node.status
          )}`}
        >
          {node.status}
        </span>
      </div>

      {/* Description */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Agent Responsibilities
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed bg-[#161824] p-3 rounded-xl border border-[#242838]">
          {node.description}
        </p>
      </div>

      {/* Input & Output Artifacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Input */}
        <div className="bg-[#161824] p-3 rounded-xl border border-[#242838] space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Input Artifacts
          </span>
          <ul className="space-y-1">
            {node.inputArtifacts.map((art, i) => (
              <li
                key={i}
                className="text-[11px] text-slate-300 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>{art}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Output */}
        <div className="bg-[#161824] p-3 rounded-xl border border-[#242838] space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
            Output Artifacts
          </span>
          <ul className="space-y-1">
            {node.outputArtifacts.map((art, i) => (
              <li
                key={i}
                className="text-[11px] text-cyan-100 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{art}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Execution Telemetry / Notes */}
      <div className="bg-[#151722] p-3 rounded-xl border border-[#242838] space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          Integration Contract & Status
        </span>
        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
          {node.telemetryNotes}
        </p>
      </div>

      {/* Metrics (if available in sample runs) */}
      {node.metrics && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#232738]/60 text-center">
          <div className="bg-[#161824] p-2 rounded-lg border border-[#242838]">
            <span className="text-[9px] uppercase text-slate-500 block">
              Latency
            </span>
            <span className="text-xs font-bold text-white font-mono">
              {node.metrics.latencyMs}ms
            </span>
          </div>
          <div className="bg-[#161824] p-2 rounded-lg border border-[#242838]">
            <span className="text-[9px] uppercase text-slate-500 block">
              Tokens
            </span>
            <span className="text-xs font-bold text-white font-mono">
              {node.metrics.tokensUsed}
            </span>
          </div>
          <div className="bg-[#161824] p-2 rounded-lg border border-[#242838]">
            <span className="text-[9px] uppercase text-slate-500 block">
              Confidence
            </span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {Math.round((node.metrics.confidenceScore || 0) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Link to module if active */}
      {toolLink && (
        <div className="pt-2">
          <Link
            href={toolLink.href}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1a1f33] hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-500/60 transition shadow-sm"
          >
            <span>Launch {toolLink.label}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
