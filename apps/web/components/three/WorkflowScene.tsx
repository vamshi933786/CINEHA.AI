"use client";

import React from "react";
import { OrbitControls } from "@react-three/drei";
import {
  WorkflowNodeData,
  WorkflowNodeId,
  WorkflowConnection,
} from "../../types/workflow";
import { WorkflowNode3D } from "./WorkflowNode";
import { WorkflowConnections } from "./WorkflowConnections";
import { WorkflowParticles } from "./WorkflowParticles";

interface WorkflowSceneProps {
  nodes: Record<WorkflowNodeId, WorkflowNodeData>;
  connections: WorkflowConnection[];
  selectedNodeId: WorkflowNodeId | null;
  onSelectNode: (id: WorkflowNodeId) => void;
  reducedMotion?: boolean;
}

export const WorkflowScene: React.FC<WorkflowSceneProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  reducedMotion = false,
}) => {
  return (
    <>
      {/* Lighting Setup */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[10, 10, 8]} intensity={1.2} />
      <pointLight position={[-8, 4, 4]} intensity={0.8} color="#06b6d4" />
      <pointLight position={[8, 4, 4]} intensity={0.8} color="#ec4899" />

      {/* Orbit Controls with Safe Constraints */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={!reducedMotion}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 1.7}
        minPolarAngle={Math.PI / 3.5}
        dampingFactor={0.05}
      />

      {/* Background Ambience */}
      <WorkflowParticles count={90} reducedMotion={reducedMotion} />

      {/* Connection Splines & Data Packets */}
      <WorkflowConnections
        connections={connections}
        nodes={nodes}
        reducedMotion={reducedMotion}
      />

      {/* Agent Nodes */}
      {Object.values(nodes).map((node) => (
        <WorkflowNode3D
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onSelect={onSelectNode}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
};
