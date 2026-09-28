import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HookCard } from "../components/hooks/HookCard";
import type { HookItem } from "../types/hook";

const mockHook: HookItem = {
  id: "hook_12345",
  hook_text: "You've been using your gimbal wrong this entire time.",
  category: "Curiosity",
  language: "Tanglish",
  platform: "Instagram Reels",
  delivery_style: "Intrigued and brisk (Cinematic)",
  visual_framing: "Extreme close-up of phone camera, quick whip-cut",
  retention_intent: "Creates a curiosity gap that is resolved through the tip.",
};

describe("Hook Generator Components", () => {
  it("renders HookCard with full metadata and copy button", () => {
    render(<HookCard hook={mockHook} index={0} />);

    expect(screen.getByText("#01")).toBeInTheDocument();
    expect(screen.getByText("Curiosity")).toBeInTheDocument();
    expect(
      screen.getByText('"You\'ve been using your gimbal wrong this entire time."')
    ).toBeInTheDocument();
    expect(
      screen.getByText("Intrigued and brisk (Cinematic)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Extreme close-up of phone camera, quick whip-cut")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Creates a curiosity gap that is resolved through the tip.")
    ).toBeInTheDocument();

    const copyBtn = screen.getByRole("button", {
      name: /copy hook text to clipboard/i,
    });
    expect(copyBtn).toBeInTheDocument();
  });

  it("handles copy action to clipboard", async () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<HookCard hook={mockHook} index={0} />);

    const copyBtn = screen.getByRole("button", {
      name: /copy hook text to clipboard/i,
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        mockHook.hook_text
      );
      expect(screen.getByText("Copied")).toBeInTheDocument();
    });
  });

  it("handles toggle save action", () => {
    const handleToggleSave = vi.fn();
    render(
      <HookCard
        hook={mockHook}
        index={0}
        isSaved={false}
        onToggleSave={handleToggleSave}
      />
    );

    const saveBtn = screen.getByRole("button", { name: /save hook/i });
    fireEvent.click(saveBtn);

    expect(handleToggleSave).toHaveBeenCalledWith(mockHook);
  });
});
