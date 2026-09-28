import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient } from "../lib/api";

describe("ApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully parses healthy health check response", async () => {
    const mockHealth = {
      status: "healthy",
      project_name: "CINEHA AI API",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      active_provider: "heuristic_mock",
      max_video_size_mb: 100,
      timestamp: "2026-09-28T12:00:00Z",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    });

    const client = new ApiClient("http://localhost:8000/api/v1");
    const result = await client.checkHealth();

    expect(result.status).toBe("healthy");
    expect(result.database).toBe("connected");
    expect(result.max_video_size_mb).toBe(100);
    expect(result.active_provider).toBe("heuristic_mock");
  });

  it("gracefully falls back when backend is unreachable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

    const client = new ApiClient("http://localhost:8000/api/v1");
    const result = await client.checkHealth();

    expect(result.status).toBe("unreachable");
    expect(result.database).toBe("disconnected");
    expect(result.max_video_size_mb).toBe(100);
  });
});
