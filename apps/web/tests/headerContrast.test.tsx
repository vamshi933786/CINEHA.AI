import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Header } from "../components/layout/Header";
import { HealthStatusBadge } from "../components/ui/HealthStatusBadge";
import { Badge } from "../components/ui/Badge";
import { api } from "../lib/api";

describe("Header Contrast and Branding Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders brand name CINEHA.AI with high-contrast theme token text-cine-text", () => {
    vi.spyOn(api, "checkHealth").mockResolvedValue({
      status: "healthy",
      project_name: "CINEHA AI API",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      active_provider: "heuristic_mock",
      max_video_size_mb: 100,
      timestamp: new Date().toISOString(),
    });

    render(<Header onMenuToggle={() => {}} />);

    const brandContainer = screen.getByText(/CINEHA/i).closest("span");
    expect(brandContainer).toBeInTheDocument();
    expect(brandContainer).toHaveClass("text-cine-text");
    expect(brandContainer).not.toHaveClass("text-white");
  });

  it("renders creator badge 'Sai Panga' with text-cine-text token", () => {
    vi.spyOn(api, "checkHealth").mockResolvedValue({
      status: "healthy",
      project_name: "CINEHA AI API",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      active_provider: "heuristic_mock",
      max_video_size_mb: 100,
      timestamp: new Date().toISOString(),
    });

    render(<Header onMenuToggle={() => {}} />);

    const creatorBadge = screen.getByText("Sai Panga");
    expect(creatorBadge).toBeInTheDocument();
    expect(creatorBadge).toHaveClass("text-cine-text");
    expect(creatorBadge).not.toHaveClass("text-slate-200");
  });

  it("renders subtitle with theme-adaptive text-cine-muted token", () => {
    vi.spyOn(api, "checkHealth").mockResolvedValue({
      status: "healthy",
      project_name: "CINEHA AI API",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      active_provider: "heuristic_mock",
      max_video_size_mb: 100,
      timestamp: new Date().toISOString(),
    });

    render(<Header onMenuToggle={() => {}} />);

    const subtitle = screen.getByText("Your Intelligent Content Creation Assistant");
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveClass("text-cine-muted");
  });
});

describe("HealthStatusBadge High-Contrast Dual Theme Verification", () => {
  it("renders healthy badge with dual-theme contrast classes", () => {
    render(
      <HealthStatusBadge
        health={{
          status: "healthy",
          project_name: "CINEHA AI API",
          version: "1.0.0",
          environment: "development",
          database: "connected",
          active_provider: "heuristic_mock",
          max_video_size_mb: 100,
          timestamp: new Date().toISOString(),
        }}
        loading={false}
      />
    );

    const badge = screen.getByTestId("health-status-healthy");
    expect(badge).toHaveClass("text-emerald-800");
    expect(badge).toHaveClass("dark:text-emerald-300");
  });

  it("renders offline badge with dual-theme contrast classes", () => {
    render(
      <HealthStatusBadge
        health={{
          status: "unreachable",
          project_name: "CINEHA AI API",
          version: "unknown",
          environment: "unknown",
          database: "disconnected",
          active_provider: "none",
          max_video_size_mb: 100,
          timestamp: new Date().toISOString(),
        }}
        loading={false}
      />
    );

    const badge = screen.getByTestId("health-status-offline");
    expect(badge).toHaveClass("text-rose-800");
    expect(badge).toHaveClass("dark:text-rose-300");
  });

  it("renders degraded badge with dual-theme contrast classes", () => {
    render(
      <HealthStatusBadge
        health={{
          status: "degraded",
          project_name: "CINEHA AI API",
          version: "1.0.0",
          environment: "development",
          database: "slow",
          active_provider: "heuristic_mock",
          max_video_size_mb: 100,
          timestamp: new Date().toISOString(),
        }}
        loading={false}
      />
    );

    const badge = screen.getByTestId("health-status-degraded");
    expect(badge).toHaveClass("text-amber-800");
    expect(badge).toHaveClass("dark:text-amber-300");
  });
});

describe("Badge Component High-Contrast Dual Theme Variants", () => {
  it("renders emerald variant with dark: modifier", () => {
    render(<Badge variant="emerald">Active</Badge>);
    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("text-emerald-800");
    expect(badge).toHaveClass("dark:text-emerald-300");
  });

  it("renders amber variant with dark: modifier", () => {
    render(<Badge variant="amber">Warning</Badge>);
    const badge = screen.getByText("Warning");
    expect(badge).toHaveClass("text-amber-800");
    expect(badge).toHaveClass("dark:text-amber-300");
  });
});
