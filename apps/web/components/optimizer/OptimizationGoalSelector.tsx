"use client";

import React from "react";
import {
  Zap,
  Clock,
  Scissors,
  HelpCircle,
  Flame,
  Sparkles,
  CheckCircle2,
  ListFilter,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  SUPPORTED_OPTIMIZATION_GOALS,
  type OptimizationGoalKey,
} from "../../types/optimizer";

interface OptimizationGoalSelectorProps {
  selectedGoals: OptimizationGoalKey[];
  onToggleGoal: (goal: OptimizationGoalKey) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  instructions: string;
  onInstructionsChange: (val: string) => void;
  disabled?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Clock,
  Scissors,
  HelpCircle,
  Flame,
  Sparkles,
};

export const OptimizationGoalSelector: React.FC<OptimizationGoalSelectorProps> = ({
  selectedGoals,
  onToggleGoal,
  onSelectAll,
  onClearAll,
  instructions,
  onInstructionsChange,
  disabled = false,
}) => {
  return (
    <div className="bg-[#12131a] border border-[#232738] rounded-2xl p-5 shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#232738]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Target Retention Goals
            </h3>
            <p className="text-xs text-slate-400">
              Select one or more algorithmic retention vectors to optimize
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={disabled || selectedGoals.length === SUPPORTED_OPTIMIZATION_GOALS.length}
            className="text-xs px-2.5 py-1 rounded-lg bg-[#1a1c29] border border-[#2d3248] text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            Select All
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={disabled || selectedGoals.length === 0}
            className="text-xs px-2.5 py-1 rounded-lg bg-[#1a1c29] border border-[#2d3248] text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" />
            Clear
          </button>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
            {selectedGoals.length} Active
          </span>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
        {SUPPORTED_OPTIMIZATION_GOALS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.key);
          const Icon = ICON_MAP[goal.iconName] || Sparkles;

          return (
            <button
              key={goal.key}
              type="button"
              onClick={() => onToggleGoal(goal.key)}
              disabled={disabled}
              className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group flex flex-col justify-between ${
                isSelected
                  ? "bg-gradient-to-br from-[#1a1f33] to-[#141724] border-cyan-500/50 shadow-lg shadow-cyan-950/30"
                  : "bg-[#161823] border-[#242838] hover:border-[#383f58] hover:bg-[#1a1d2d]"
              } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/20 to-transparent pointer-events-none" />
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-[#202435] text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs font-bold transition-colors ${
                      isSelected ? "text-cyan-200" : "text-slate-200 group-hover:text-white"
                    }`}
                  >
                    {goal.label}
                  </span>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-600 group-hover:border-slate-400" />
                  )}
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-400 group-hover:text-slate-300">
                {goal.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Creator Instructions Input */}
      <div className="mt-4 pt-4 border-t border-[#232738]">
        <label
          htmlFor="creator-instructions"
          className="block text-xs font-semibold text-slate-300 mb-1.5"
        >
          Custom Creator Guidance (Optional)
        </label>
        <textarea
          id="creator-instructions"
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          disabled={disabled}
          placeholder="E.g., Preserve the technical jargon, emphasize color grading equipment, maintain high-energy casual tone..."
          rows={2}
          className="w-full bg-[#161824] border border-[#262b3d] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition resize-none disabled:opacity-50"
        />
      </div>
    </div>
  );
};
