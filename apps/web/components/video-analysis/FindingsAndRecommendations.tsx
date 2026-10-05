"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, ArrowRight, Info } from "lucide-react";

interface FindingsAndRecommendationsProps {
  findings: string[];
  recommendations: string[];
  limitations?: string[];
}

export function FindingsAndRecommendations({
  findings,
  recommendations,
  limitations = [],
}: FindingsAndRecommendationsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Key Findings Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Observed Strengths & Hazards</span>
        </h3>

        {findings && findings.length > 0 ? (
          <ul className="space-y-2.5">
            {findings.map((item, idx) => {
              const isHazard =
                item.toLowerCase().includes("hazard") ||
                item.toLowerCase().includes("risk") ||
                item.toLowerCase().includes("critique") ||
                item.toLowerCase().includes("drop-off");

              return (
                <li
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                    isHazard
                      ? "border-amber-800/40 bg-amber-950/20 text-amber-200"
                      : "border-slate-800 bg-slate-950/50 text-slate-200"
                  }`}
                >
                  {isHazard ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 italic">No specific structural hazards identified.</p>
        )}
      </div>

      {/* Actionable Recommendations Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Prioritized Action Items</span>
        </h3>

        {recommendations && recommendations.length > 0 ? (
          <ul className="space-y-2.5">
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="p-3 rounded-xl border border-cyan-800/30 bg-cyan-950/20 text-cyan-200 text-xs leading-relaxed flex items-start gap-2.5"
              >
                <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{rec}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 italic">No recommendations generated.</p>
        )}

        {/* Limitations Notice if present */}
        {limitations && limitations.length > 0 && (
          <div className="pt-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Diagnostic Disclosures & Methodology</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400/90">
                {limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
