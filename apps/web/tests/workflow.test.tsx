import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Accessible2DWorkflow } from "../components/three/Accessible2DWorkflow";
import { WorkflowNodeDetailPanel } from "../components/three/WorkflowNodeDetailPanel";
import { WorkflowControls } from "../components/three/WorkflowControls";
import { ThreeCanvasErrorBoundary } from "../components/three/ThreeCanvasErrorBoundary";
import { useWorkflowState } from "../hooks/useWorkflowState";
import {
  DEFAULT_WORKFLOW_NODES,
  DEFAULT_WORKFLOW_CONNECTIONS,
  WorkflowNodeData,
} from "../types/workflow";
import { PRIMARY_NAV_ITEMS } from "../lib/navigation";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/workflow",
}));

describe("Phase 8: 3D Workflow Visualization Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Navigation & Routing Integration", () => {
    it("registers /workflow in PRIMARY_NAV_ITEMS with correct label and metadata", () => {
      const workflowItem = PRIMARY_NAV_ITEMS.find((item) => item.href === "/workflow");
      expect(workflowItem).toBeDefined();
      expect(workflowItem?.label).toBe("3D Workflow");
      expect(workflowItem?.badge).toBe("Phase 8");
      expect(workflowItem?.description).toBe("Interactive multi-agent orchestration pipeline");
    });
  });

  describe("Workflow State Contract & useWorkflowState Hook", () => {
    it("initializes with honest idle architecture blueprint", () => {
      const { result } = renderHook(() => useWorkflowState());

      expect(result.current.isLiveTelemetry).toBe(false);
      expect(result.current.activePreset).toBe("idle_blueprint");
      expect(result.current.globalStatus).toBe("idle");

      // Verify all 8 core nodes exist
      const nodeKeys = Object.keys(result.current.nodes);
      expect(nodeKeys).toContain("user_request");
      expect(nodeKeys).toContain("orchestrator");
      expect(nodeKeys).toContain("research");
      expect(nodeKeys).toContain("hook");
      expect(nodeKeys).toContain("script");
      expect(nodeKeys).toContain("review");
      expect(nodeKeys).toContain("optimizer");
      expect(nodeKeys).toContain("final_output");

      // Verify default status is idle
      Object.values(result.current.nodes).forEach((node) => {
        expect(node.status).toBe("idle");
      });
    });

    it("applies sample run scenario and updates node statuses", () => {
      const { result } = renderHook(() => useWorkflowState());

      act(() => {
        result.current.applyPreset("sample_run");
      });

      expect(result.current.activePreset).toBe("sample_run");
      expect(result.current.globalStatus).toBe("running");
      expect(result.current.nodes.optimizer.status).toBe("processing");
      expect(result.current.nodes.script.status).toBe("completed");
      expect(result.current.nodes.final_output.status).toBe("waiting");
    });

    it("applies error scenario and updates error status on review node", () => {
      const { result } = renderHook(() => useWorkflowState());

      act(() => {
        result.current.applyPreset("error_case");
      });

      expect(result.current.activePreset).toBe("error_case");
      expect(result.current.globalStatus).toBe("error");
      expect(result.current.nodes.review.status).toBe("error");
      expect(result.current.selectedNodeId).toBe("review");
    });

    it("allows selecting nodes and toggling view modes", () => {
      const { result } = renderHook(() => useWorkflowState());

      act(() => {
        result.current.setSelectedNodeId("hook");
      });
      expect(result.current.selectedNodeId).toBe("hook");
      expect(result.current.selectedNode?.name).toBe("Hook Generator");

      act(() => {
        result.current.setViewMode("2d");
      });
      expect(result.current.viewMode).toBe("2d");
    });
  });

  describe("Accessible2DWorkflow Component", () => {
    it("renders semantic ordered list and all 8 workflow stages with accessible labels", () => {
      const mockSelect = vi.fn();

      render(
        <Accessible2DWorkflow
          nodes={DEFAULT_WORKFLOW_NODES}
          connections={DEFAULT_WORKFLOW_CONNECTIONS}
          selectedNodeId="orchestrator"
          onSelectNode={mockSelect}
        />
      );

      // Verify semantic accessibility container
      const region = screen.getByRole("region", {
        name: /Accessible 2D Workflow Representation/i,
      });
      expect(region).toBeInTheDocument();

      const ol = screen.getByRole("list", {
        name: /CINEHA AI Content Generation Workflow Pipeline/i,
      });
      expect(ol).toBeInTheDocument();

      // Verify all required node names
      expect(screen.getByText("User Request")).toBeInTheDocument();
      expect(screen.getByText("Orchestrator Agent")).toBeInTheDocument();
      expect(screen.getByText("Research Agent")).toBeInTheDocument();
      expect(screen.getByText("Hook Generator")).toBeInTheDocument();
      expect(screen.getByText("Script Studio Agent")).toBeInTheDocument();
      expect(screen.getByText("Retention Analyzer")).toBeInTheDocument();
      expect(screen.getByText("Script Optimizer")).toBeInTheDocument();
      expect(screen.getByText("Production Ready Screenplay")).toBeInTheDocument();

      // Verify clicking triggers selection callback
      fireEvent.click(screen.getByText("Hook Generator"));
      expect(mockSelect).toHaveBeenCalledWith("hook");
    });

    it("renders distinct status indicators for processing, completed, waiting, error, and idle", () => {
      const customNodes: Record<string, WorkflowNodeData> = {
        ...DEFAULT_WORKFLOW_NODES,
        hook: { ...DEFAULT_WORKFLOW_NODES.hook, status: "processing" },
        script: { ...DEFAULT_WORKFLOW_NODES.script, status: "completed" },
        optimizer: { ...DEFAULT_WORKFLOW_NODES.optimizer, status: "waiting" },
        review: { ...DEFAULT_WORKFLOW_NODES.review, status: "error" },
      };

      render(
        <Accessible2DWorkflow
          nodes={customNodes}
          connections={DEFAULT_WORKFLOW_CONNECTIONS}
          selectedNodeId="hook"
          onSelectNode={vi.fn()}
        />
      );

      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(screen.getAllByText("Completed")[0]).toBeInTheDocument();
      expect(screen.getByText("Waiting")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getAllByText("Idle / Standby").length).toBeGreaterThan(0);
    });
  });

  describe("WorkflowNodeDetailPanel Component", () => {
    it("renders selected node details, input/output artifacts, and tool navigation link", () => {
      const selectedNode = DEFAULT_WORKFLOW_NODES.optimizer;

      render(<WorkflowNodeDetailPanel node={selectedNode} />);

      expect(screen.getByText("Script Optimizer")).toBeInTheDocument();
      expect(screen.getByText("Retention & Pacing Rewriter")).toBeInTheDocument();
      expect(screen.getByText("Agent Responsibilities")).toBeInTheDocument();

      // Input and output artifacts
      expect(screen.getByText("Retention Audit")).toBeInTheDocument();
      expect(screen.getByText("Optimized Screenplay")).toBeInTheDocument();

      // Quick launch link to tool
      const launchLink = screen.getByRole("link", { name: /Launch Script Optimizer/i });
      expect(launchLink).toHaveAttribute("href", "/optimizer");
    });

    it("renders empty state placeholder when no node is selected", () => {
      render(<WorkflowNodeDetailPanel node={null} />);
      expect(
        screen.getByText(/Select a node in the workflow canvas or diagram to inspect/i)
      ).toBeInTheDocument();
    });
  });

  describe("WorkflowControls Component", () => {
    it("renders view mode switcher and scenario preset buttons", () => {
      const mockViewChange = vi.fn();
      const mockPresetChange = vi.fn();

      render(
        <WorkflowControls
          viewMode="3d"
          onViewModeChange={mockViewChange}
          activePreset="idle_blueprint"
          onPresetChange={mockPresetChange}
          globalStatus="idle"
          webglSupported={true}
        />
      );

      // View toggle
      const switch2DBtn = screen.getByRole("button", { name: /2D Diagram/i });
      fireEvent.click(switch2DBtn);
      expect(mockViewChange).toHaveBeenCalledWith("2d");

      // Presets
      const pipelineDemoBtn = screen.getByRole("button", { name: /Pipeline Demo/i });
      fireEvent.click(pipelineDemoBtn);
      expect(mockPresetChange).toHaveBeenCalledWith("sample_run");

      const alertDemoBtn = screen.getByRole("button", { name: /Alert Demo/i });
      fireEvent.click(alertDemoBtn);
      expect(mockPresetChange).toHaveBeenCalledWith("error_case");
    });
  });

  describe("ThreeCanvasErrorBoundary & WebGL Failure Handling", () => {
    it("catches WebGL errors and renders accessible 2D fallback gracefully", () => {
      const ProblematicCanvas = () => {
        throw new Error("WebGL Context Initialization Failed");
      };

      const fallbackUI = <div data-testid="fallback-view">Fallback 2D Active</div>;

      render(
        <ThreeCanvasErrorBoundary fallback={fallbackUI}>
          <ProblematicCanvas />
        </ThreeCanvasErrorBoundary>
      );

      expect(screen.getByTestId("fallback-view")).toBeInTheDocument();
      expect(screen.getByText("Fallback 2D Active")).toBeInTheDocument();
    });
  });
});
