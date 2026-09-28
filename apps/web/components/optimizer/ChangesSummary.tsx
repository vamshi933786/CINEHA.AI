"use client";

import React, { useState } from "react";
import {
  ListChecks,
  Filter,
  Check,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import type { ScriptChangeItem } from "../../types/optimizer";

interface ChangesSummaryProps {
  changes: ScriptChangeItem[];
}

export const ChangesSummary: React.FC<ChangesSummaryProps> = ({ changes }) => {
  const [selectedSection, setSelectedSection] = useState<string>("all");

  const sections = Array.from(new Set(changes.map((c) => c.section.toLowerCase())));

  const filteredChanges =
    selectedSection === "all"
      ? changes
      : changes.filter((c) => c.section.toLowerCase() === selectedSection);

  const getSectionBadgeStyle = (section: string) => {
    switch (section.toLowerCase()) {
      case "hook":
        return "bg-amber-950/70 border-amber-500/40 text-amber-300";
      case "pacing":
        return "bg-cyan-950/70 border-cyan-500/40 text-cyan-300";
      case "filler":
        return "bg-rose-950/70 border-rose-500/40 text-rose-300";
      case "curiosity":
        return "bg-purple-950/70 border-purple-500/40 text-purple-300";
      case "cta":
        return "bg-emerald-950/70 border-emerald-500/40 text-emerald-300";
      default:
        return "bg-slate-800 border-slate-700 text-slate-300";
    }
  };

  return (
    <div className="bg-[#12131a] border border-[#232738] rounded-2xl p-5 shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#232738]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Optimization Audit Trail
            </h3>
            <p className="text-xs text-slate-400">
              {changes.length} strategic changes applied across screenplay beats
            </p>
          </div>
        </div>

        {/* Section Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSection("all")}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              selectedSection === "all"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "bg-[#181a26] text-slate-400 border border-[#262b3d] hover:text-slate-200"
            }`}
          >
            All ({changes.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={`text-xs px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                selectedSection === sec
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "bg-[#181a26] text-slate-400 border border-[#262b3d] hover:text-slate-200"
              }`}
            >
              {sec} ({changes.filter((c) => c.section.toLowerCase() === sec).length})
            </button>
          ))}
        </div>
      </div>

      {/* Changes List */}
      <div className="mt-4 space-y-3">
        {filteredChanges.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No specific changes recorded for this filter.
          </div>
        ) : (
          filteredChanges.map((item, idx) => (
            <div
              key={`${item.section}-${item.field}-${idx}`}
              className="bg-[#151724] border border-[#232738] rounded-xl p-3.5 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getSectionBadgeStyle(
                      item.section
                    )}`}
                  >
                    {item.section}
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Field: <strong className="text-white">{item.field}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Info className="w-3 h-3 text-cyan-400" />
                  <span>{item.reason}</span>
                </div>
              </div>

              {/* Before vs After snippet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {/* Before */}
                <div className="bg-[#191c2b] p-2.5 rounded-lg border border-[#262c3e]">
                  <span className="text-[10px] font-semibold text-rose-400/90 uppercase tracking-wide block mb-1">
                    Before
                  </span>
                  <p className="text-slate-400 leading-relaxed italic text-[11px]">
                    &ldquo;{item.before || "(empty)"}&rdquo;
                  </p>
                </div>

                {/* After */}
                <div className="bg-[#172033] p-2.5 rounded-lg border border-cyan-500/30">
                  <span className="text-[10px] font-semibold text-emerald-400/90 uppercase tracking-wide block mb-1">
                    Optimized
                  </span>
                  <p className="text-cyan-100 font-medium leading-relaxed italic text-[11px]">
                    &ldquo;{item.after}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
