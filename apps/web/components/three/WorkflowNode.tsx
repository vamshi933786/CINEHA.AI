"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { WorkflowNodeData, WorkflowNodeId } from "../../types/workflow";

interface WorkflowNode3DProps {
  node: WorkflowNodeData;
  isSelected: boolean;
  onSelect: (id: WorkflowNodeId) => void;
  reducedMotion?: boolean;
}

export const WorkflowNode3D: React.FC<WorkflowNode3DProps> = ({
  node,
  isSelected,
  onSelect,
  reducedMotion = false,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Status-driven materials & emissives
  const getStatusColors = (status: WorkflowNodeData["status"]) => {
    switch (status) {
      case "processing":
        return {
          core: "#06b6d4",
          emissive: "#06b6d4",
          emissiveIntensity: 1.2,
          ring: "#22d3ee",
        };
      case "completed":
        return {
          core: "#10b981",
          emissive: "#10b981",
          emissiveIntensity: 0.9,
          ring: "#34d399",
        };
      case "waiting":
        return {
          core: "#f59e0b",
          emissive: "#f59e0b",
          emissiveIntensity: 0.8,
          ring: "#fbbf24",
        };
      case "error":
        return {
          core: "#ef4444",
          emissive: "#ef4444",
          emissiveIntensity: 1.4,
          ring: "#f87171",
        };
      case "idle":
      default:
        return {
          core: node.color,
          emissive: "#1e293b",
          emissiveIntensity: 0.3,
          ring: "#475569",
        };
    }
  };

  const colors = getStatusColors(node.status);

  // Subtle floating and rotation animation
  useFrame((state, delta) => {
    if (!meshRef.current || reducedMotion) return;

    // Harmonic floating
    const t = state.clock.getElapsedTime();
    const floatOffset = Math.sin(t * 1.5 + node.order) * 0.08;
    meshRef.current.position.y = node.position3D[1] + floatOffset;

    // Slow rotation
    meshRef.current.rotation.y += delta * 0.4;

    // Fast status ring spin when processing
    if (ringRef.current && node.status === "processing") {
      ringRef.current.rotation.z += delta * 2.5;
    }
  });

  const baseScale = isSelected ? 1.25 : hovered ? 1.15 : 1.0;

  return (
    <group
      ref={meshRef}
      position={node.position3D}
      scale={[baseScale, baseScale, baseScale]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Outer Polyhedral Cage */}
      <mesh>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color={colors.core}
          wireframe
          transparent
          opacity={isSelected ? 0.9 : 0.45}
        />
      </mesh>

      {/* Glowing Inner Core Sphere */}
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial
          color={colors.core}
          emissive={colors.emissive}
          emissiveIntensity={isSelected ? 1.5 : colors.emissiveIntensity}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* Orbiting Status Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.85, 0.02, 16, 48]} />
        <meshBasicMaterial
          color={colors.ring}
          transparent
          opacity={isSelected ? 0.9 : node.status === "processing" ? 0.8 : 0.3}
        />
      </mesh>

      {/* Selection Glow Halos */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[1.05, 16, 16]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.15}
            wireframe
          />
        </mesh>
      )}

      {/* Crisp 3D HTML Overlay Label */}
      <Html
        position={[0, -1.1, 0]}
        center
        distanceFactor={14}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          className={`flex flex-col items-center px-2 py-1 rounded-lg backdrop-blur-md transition-all ${
            isSelected
              ? "bg-[#181d2f]/95 border border-cyan-500/60 shadow-lg shadow-cyan-950/60"
              : hovered
              ? "bg-[#161824]/90 border border-slate-600"
              : "bg-[#12131a]/80 border border-white/10"
          }`}
        >
          <span
            className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${
              isSelected ? "text-cyan-300" : "text-white"
            }`}
          >
            {node.name}
          </span>
          <span className="text-[9px] font-mono text-slate-400 capitalize">
            {node.status}
          </span>
        </div>
      </Html>
    </group>
  );
};
