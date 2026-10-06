import React from "react";
import { Badge } from "./Badge";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  isDemo?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "positive",
  icon,
  isDemo = true,
}: StatCardProps) {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-cine-surface/90 border border-cine-border/70 hover:border-cine-accent/40 transition-all duration-200 flex flex-col justify-between group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-cine-muted">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-cine-card border border-cine-border/80 flex items-center justify-center text-slate-300 group-hover:text-cine-accent group-hover:border-cine-accent/30 transition-colors">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-cine-text font-mono">
          {value}
        </span>
        {change && (
          <span
            className={`text-xs font-mono font-medium ${
              changeType === "positive"
                ? "text-cine-emerald"
                : changeType === "negative"
                ? "text-cine-rose"
                : "text-slate-400"
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {isDemo && (
        <div className="mt-3 pt-2.5 border-t border-cine-border/40 flex items-center justify-between">
          <Badge variant="neutral" size="sm">
            Prototype Metric
          </Badge>
          <span className="text-[10px] text-slate-500 font-mono">Demo Data</span>
        </div>
      )}
    </div>
  );
}
