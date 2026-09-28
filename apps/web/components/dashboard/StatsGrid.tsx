import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { FileText, Sparkles, Video, Percent } from "lucide-react";

export function StatsGrid() {
  const stats = [
    {
      title: "Scripts Created",
      value: "24",
      change: "+8 this month",
      changeType: "positive" as const,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      title: "Hooks Generated",
      value: "148",
      change: "+32 this week",
      changeType: "positive" as const,
      icon: <Sparkles className="w-4 h-4 text-cine-accent" />,
    },
    {
      title: "Videos Analyzed",
      value: "12",
      change: "100MB limit guardrail",
      changeType: "neutral" as const,
      icon: <Video className="w-4 h-4 text-cine-rose" />,
    },
    {
      title: "Average Retention Score",
      value: "88.4%",
      change: "Heuristic assessment",
      changeType: "positive" as const,
      icon: <Percent className="w-4 h-4 text-cine-emerald" />,
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">
          Creator Performance Pulse
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">
          Prototype Metrics · Phase 3 Demo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            isDemo={true}
          />
        ))}
      </div>
    </section>
  );
}
