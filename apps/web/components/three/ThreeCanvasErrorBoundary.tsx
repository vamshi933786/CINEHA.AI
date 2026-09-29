"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onCatch?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ThreeCanvasErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("ThreeCanvasErrorBoundary caught WebGL/3D failure:", error, errorInfo);
    if (this.props.onCatch) {
      this.props.onCatch(error, errorInfo);
    }
  }

  public resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 rounded-2xl bg-cine-surface/90 border border-cine-border text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            3D WebGL Visualization Unavailable
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            Your hardware or browser environment cannot initialize the WebGL context. Falling back to the accessible 2D workflow diagram.
          </p>
          <button
            type="button"
            onClick={this.resetError}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-cine-card hover:bg-slate-700 border border-cine-border transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry 3D Initialization</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
