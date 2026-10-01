"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  WorkflowNodeId,
  WorkflowNodeData,
  WorkflowNodeStatus,
  WorkflowState,
  DEFAULT_WORKFLOW_NODES,
  DEFAULT_WORKFLOW_CONNECTIONS,
} from "../types/workflow";

export function useWorkflowState() {
  const [nodes, setNodes] = useState(() => {
    const initial = {} as Record<WorkflowNodeId, WorkflowNodeData>;
    (Object.keys(DEFAULT_WORKFLOW_NODES) as WorkflowNodeId[]).forEach((key) => {
      initial[key] = { ...DEFAULT_WORKFLOW_NODES[key] };
    });
    return initial;
  });
  const [connections, setConnections] = useState(DEFAULT_WORKFLOW_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<WorkflowNodeId | null>("orchestrator");
  const [activeNodeId, setActiveNodeId] = useState<WorkflowNodeId | null>(null);
  const [globalStatus, setGlobalStatus] = useState<WorkflowState["globalStatus"]>("idle");
  const [activePreset, setActivePreset] = useState<WorkflowState["activePreset"]>("idle_blueprint");
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // Detect prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    try {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery?.matches ?? false);

      const listener = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      if (mediaQuery?.addEventListener) {
        mediaQuery.addEventListener("change", listener);
        return () => mediaQuery.removeEventListener("change", listener);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // Detect WebGL availability
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        setViewMode("2d");
      }
    } catch {
      setWebglSupported(false);
      setViewMode("2d");
    }
  }, []);

  // Set Preset Modes
  const applyPreset = useCallback((preset: WorkflowState["activePreset"]) => {
    setActivePreset(preset);

    if (preset === "idle_blueprint") {
      setNodes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          next[key as WorkflowNodeId] = {
            ...next[key as WorkflowNodeId],
            status: "idle",
            metrics: undefined,
          };
        });
        return next;
      });
      setConnections(
        DEFAULT_WORKFLOW_CONNECTIONS.map((c) => ({ ...c, active: false }))
      );
      setActiveNodeId(null);
      setGlobalStatus("idle");
    } else if (preset === "sample_run") {
      // Completed full pipeline demo
      setNodes((prev) => {
        const next = { ...prev };
        (Object.keys(next) as WorkflowNodeId[]).forEach((key, index) => {
          let status: WorkflowNodeStatus = "completed";
          if (key === "review") status = "processing";
          if (key === "final_output") status = "waiting";
          next[key] = {
            ...next[key],
            status,
            metrics: {
              latencyMs: 120 + index * 45,
              tokensUsed: 250 + index * 120,
              confidenceScore: 0.92,
            },
          };
        });
        return next;
      });
      setConnections(
        DEFAULT_WORKFLOW_CONNECTIONS.map((c, i) => ({
          ...c,
          active: i <= 3,
        }))
      );
      setActiveNodeId("review");
      setGlobalStatus("running");
    } else if (preset === "error_case") {
      // Diagnostic failure demonstration (e.g. low hook retention score)
      setNodes((prev) => ({
        ...prev,
        user_request: { ...prev.user_request, status: "completed" },
        orchestrator: { ...prev.orchestrator, status: "completed" },
        research: { ...prev.research, status: "completed" },
        hook: { ...prev.hook, status: "completed" },
        review: {
          ...prev.review,
          status: "error",
          telemetryNotes:
            "Retention threshold breach: Hook duration exceeds 4.5s; 3 conversational filler phrases flagged.",
        },
        final_output: { ...prev.final_output, status: "idle" },
      }));
      setConnections(
        DEFAULT_WORKFLOW_CONNECTIONS.map((c, i) => ({
          ...c,
          active: i < 3,
        }))
      );
      setActiveNodeId("review");
      setSelectedNodeId("review");
      setGlobalStatus("error");
    }
  }, []);

  const selectedNode = useMemo(() => {
    return selectedNodeId ? nodes[selectedNodeId] : null;
  }, [nodes, selectedNodeId]);

  return {
    nodes,
    connections,
    selectedNodeId,
    selectedNode,
    activeNodeId,
    globalStatus,
    activePreset,
    viewMode,
    webglSupported,
    prefersReducedMotion,
    setSelectedNodeId,
    setViewMode,
    applyPreset,
    isLiveTelemetry: false, // Honest flag: real backend multi-agent background executor is future work
  };
}
