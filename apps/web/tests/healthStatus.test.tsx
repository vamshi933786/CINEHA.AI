import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HealthStatusBadge } from "../components/ui/HealthStatusBadge";
import { Header } from "../components/layout/Header";
import { api } from "../lib/api";
import type { HealthResponse } from "../types/api";

describe("HealthStatusBadge Component", () => {
  it("renders pending heartbeat state when loading is true", () => {
    render(<HealthStatusBadge health={null} loading={true} />);
    expect(screen.getByText(/checking system heartbeat/i)).toBeInTheDocument();
    expect(screen.getByTestId("health-status-loading")).toBeInTheDocument();
  });

  it("renders healthy state with DB and limit information", () => {
    const mockHealth: HealthResponse = {
      status: "healthy",
      project_name: "CINEHA AI API",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      active_provider: "heuristic_mock",
      max_video_size_mb: 100,
      timestamp: new Date().toISOString(),
    };

    render(<HealthStatusBadge health={mockHealth} loading={false} />);
    expect(
      screen.getByText("API: HEALTHY | DB: connected | LIMIT: 100MB")
    ).toBeInTheDocument();
    expect(screen.getByTestId("health-status-healthy")).toBeInTheDocument();
  });

  it("renders API: OFFLINE when backend is unreachable", () => {
    const mockUnreachable: HealthResponse = {
      status: "unreachable",
      project_name: "CINEHA AI API",
      version: "unknown",
      environment: "unknown",
      database: "disconnected",
      active_provider: "none",
      max_video_size_mb: 100,
      timestamp: new Date().toISOString(),
    };

    render(<HealthStatusBadge health={mockUnreachable} loading={false} />);
    expect(screen.getByText("API: OFFLINE")).toBeInTheDocument();
    expect(screen.getByTestId("health-status-offline")).toBeInTheDocument();
  });

  it("renders API: OFFLINE when health is null and not loading", () => {
    render(<HealthStatusBadge health={null} loading={false} />);
    expect(screen.getByText("API: OFFLINE")).toBeInTheDocument();
    expect(screen.getByTestId("health-status-offline")).toBeInTheDocument();
  });

  it("renders API: DEGRADED when health status is degraded", () => {
    const mockDegraded: HealthResponse = {
      status: "degraded",
      project_name: "CINEHA AI API",
      version: "1.0.0",
      environment: "production",
      database: "slow",
      active_provider: "openai",
      max_video_size_mb: 100,
      timestamp: new Date().toISOString(),
    };

    render(<HealthStatusBadge health={mockDegraded} loading={false} />);
    expect(screen.getByText("API: DEGRADED")).toBeInTheDocument();
    expect(screen.getByTestId("health-status-degraded")).toBeInTheDocument();
  });
});

describe("Header Component Live Heartbeat Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("transitions from checking to healthy upon successful backend response", async () => {
    const mockHealth: HealthResponse = {
      status: "healthy",
      project_name: "CINEHA AI API",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      active_provider: "heuristic_mock",
      max_video_size_mb: 100,
      timestamp: new Date().toISOString(),
    };

    vi.spyOn(api, "checkHealth").mockResolvedValue(mockHealth);

    render(<Header onMenuToggle={() => {}} />);

    // Initially checking
    expect(screen.getByText(/checking system heartbeat/i)).toBeInTheDocument();

    // Transitions to healthy
    await waitFor(() => {
      expect(
        screen.getByText("API: HEALTHY | DB: connected | LIMIT: 100MB")
      ).toBeInTheDocument();
    });
  });

  it("transitions to API: OFFLINE when health check fails", async () => {
    vi.spyOn(api, "checkHealth").mockResolvedValue({
      status: "unreachable",
      project_name: "CINEHA AI API",
      version: "unknown",
      environment: "unknown",
      database: "disconnected",
      active_provider: "none",
      max_video_size_mb: 100,
      timestamp: new Date().toISOString(),
    });

    render(<Header onMenuToggle={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("API: OFFLINE")).toBeInTheDocument();
    });
  });
});
