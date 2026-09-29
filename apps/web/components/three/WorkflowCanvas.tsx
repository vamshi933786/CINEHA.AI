"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  WorkflowNodeData,
  WorkflowNodeId,
  WorkflowConnection,
} from "../../types/workflow";
import { WorkflowScene } from "./WorkflowScene";
import { ThreeCanvasErrorBoundary } from "./ThreeCanvasErrorBoundary";
import { Accessible2DWorkflow } from "./Accessible2DWorkflow";
import { Loader2 } from "lucide-react";

interface WorkflowCanvasProps {
  nodes: Record<WorkflowNodeId, WorkflowNodeData>;
  connections: WorkflowConnection[];
  selectedNodeId: WorkflowNodeId | null;
  onSelectNode: (id: WorkflowNodeId) => void;
  reducedMotion?: boolean;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  reducedMotion = false,
}) => {
  return (
    <ThreeCanvasErrorBoundary
      fallback={
        <Accessible2DWorkflow
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          reducedMotion={reducedMotion}
        />
      }
    >
      <div className="relative w-full h-[540px] md:h-[620px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0b0c13] via-[#0f111a] to-[#121422] border border-[#232738] shadow-2xl">
        {/* Subtle Canvas Watermark & Helper Overlay */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-[#121420]/80 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Interactive 3D Stage • Drag to Orbit • Scroll to Zoom</span>
        </div>

        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs font-mono">Initializing 3D Canvas...</span>
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 14], fov: 45 }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
          >
            <WorkflowScene
              nodes={nodes}
              connections={connections}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              reducedMotion={reducedMotion}
            />
          </Canvas>
        </Suspense>
      </div>
    </ThreeCanvasErrorBoundary>
  );
};
