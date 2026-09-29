"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  WorkflowConnection,
  WorkflowNodeData,
  WorkflowNodeId,
} from "../../types/workflow";

interface WorkflowConnectionsProps {
  connections: WorkflowConnection[];
  nodes: Record<WorkflowNodeId, WorkflowNodeData>;
  reducedMotion?: boolean;
}

interface SingleConnectionProps {
  connection: WorkflowConnection;
  fromNode: WorkflowNodeData;
  toNode: WorkflowNodeData;
  reducedMotion?: boolean;
}

const SingleConnection: React.FC<SingleConnectionProps> = ({
  connection,
  fromNode,
  toNode,
  reducedMotion = false,
}) => {
  const pulseMeshRef = useRef<THREE.Mesh>(null);

  // Generate smooth Quadratic Bezier Curve between nodes
  const { curve, lineGeometry } = useMemo(() => {
    const start = new THREE.Vector3(...fromNode.position3D);
    const end = new THREE.Vector3(...toNode.position3D);

    // Midpoint control point with graceful elevation
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    mid.y += 0.8;

    const bezierCurve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = bezierCurve.getPoints(32);
    const geom = new THREE.BufferGeometry().setFromPoints(points);

    return { curve: bezierCurve, lineGeometry: geom };
  }, [fromNode.position3D, toNode.position3D]);

  // Animate pulse particle along curve
  useFrame((state) => {
    if (!pulseMeshRef.current || reducedMotion || !connection.active) return;

    const t = (state.clock.getElapsedTime() * 0.75 + fromNode.order * 0.25) % 1;
    const point = curve.getPointAt(t);
    pulseMeshRef.current.position.copy(point);
  });

  const isActive = connection.active || fromNode.status === "processing";
  const lineColor = isActive ? "#22d3ee" : "#334155";
  const lineOpacity = isActive ? 0.75 : 0.35;

  return (
    <group>
      {/* Static Bezier Line */}
      {/* @ts-ignore R3F line primitive */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={lineOpacity}
          linewidth={1}
        />
      </line>

      {/* Traveling Data Pulse Particle */}
      {isActive && (
        <mesh ref={pulseMeshRef}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      )}
    </group>
  );
};

export const WorkflowConnections: React.FC<WorkflowConnectionsProps> = ({
  connections,
  nodes,
  reducedMotion = false,
}) => {
  return (
    <group>
      {connections.map((conn) => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        if (!fromNode || !toNode) return null;

        return (
          <SingleConnection
            key={conn.id}
            connection={conn}
            fromNode={fromNode}
            toNode={toNode}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </group>
  );
};
