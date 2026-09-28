import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "accent"
    | "emerald"
    | "amber"
    | "rose"
    | "neutral"
    | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-mono font-medium rounded-full transition-colors";

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantStyles = {
    default: "bg-cine-card text-slate-300 border border-cine-border",
    accent:
      "bg-cine-accent/15 text-indigo-300 border border-cine-accent/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]",
    emerald:
      "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30",
    amber: "bg-amber-950/40 text-amber-300 border border-amber-500/30",
    rose: "bg-pink-950/40 text-pink-300 border border-pink-500/30",
    neutral: "bg-slate-800/60 text-slate-300 border border-slate-700/60",
    outline: "bg-transparent text-slate-400 border border-cine-border",
  };

  return (
    <span
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
