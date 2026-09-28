"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cine-bg disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 min-h-[36px] gap-1.5",
      md: "text-sm px-4 py-2 min-h-[42px] sm:min-h-[40px] gap-2",
      lg: "text-base px-5 py-2.5 min-h-[48px] gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-cine-accent to-indigo-600 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-cine-accent/25 border border-indigo-400/20",
      secondary:
        "bg-cine-card hover:bg-cine-surface text-cine-text border border-cine-border hover:border-cine-accent/40 shadow-sm",
      outline:
        "bg-transparent hover:bg-cine-surface/60 text-slate-300 hover:text-white border border-cine-border hover:border-slate-500",
      ghost:
        "bg-transparent hover:bg-cine-card/60 text-slate-300 hover:text-white border border-transparent",
      danger:
        "bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm border border-rose-500/30",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
