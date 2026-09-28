import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProfileForm } from "../components/profile/ProfileForm";
import { ProfileSummaryCard } from "../components/profile/ProfileSummaryCard";
import type { CreatorProfile } from "../types/creatorProfile";

const mockProfile: CreatorProfile = {
  id: "test-profile-1",
  creator_name: "Sai Panga",
  niche: "Cinematography",
  target_audience: "Aspiring mobile filmmakers",
  platforms: ["Instagram Reels", "YouTube Shorts"],
  primary_language: "Tanglish",
  content_tones: ["Educational", "Cinematic"],
  creator_bio: "Filmmaker & creator",
  content_goals: ["Increase retention", "Build personal brand"],
  created_at: "2026-09-28T12:00:00Z",
  updated_at: "2026-09-28T12:00:00Z",
};

describe("Creator Profile Components", () => {
  it("renders ProfileSummaryCard with creator persona details", () => {
    const handleEdit = vi.fn();
    render(<ProfileSummaryCard profile={mockProfile} onEdit={handleEdit} />);

    expect(screen.getByText("Sai Panga")).toBeInTheDocument();
    expect(screen.getByText(/Cinematography/)).toBeInTheDocument();
    expect(screen.getByText("Tanglish")).toBeInTheDocument();
    expect(screen.getByText("Instagram Reels")).toBeInTheDocument();
    expect(screen.getByText("Educational")).toBeInTheDocument();

    const editBtn = screen.getByRole("button", { name: /edit profile/i });
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("renders ProfileForm and triggers validation when submitting empty required fields", async () => {
    const handleSave = vi.fn();
    render(
      <ProfileForm
        initialData={{
          ...mockProfile,
          creator_name: "",
          platforms: [],
        }}
        onSave={handleSave}
      />
    );

    const submitBtn = screen.getByRole("button", {
      name: /save creator profile/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/creator name is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/select at least one platform/i)
      ).toBeInTheDocument();
    });

    expect(handleSave).not.toHaveBeenCalled();
  });

  it("submits valid form data correctly", async () => {
    const handleSave = vi.fn().mockResolvedValue({ success: true });
    render(<ProfileForm initialData={mockProfile} onSave={handleSave} />);

    const submitBtn = screen.getByRole("button", {
      name: /save creator profile/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          creator_name: "Sai Panga",
          niche: "Cinematography",
          primary_language: "Tanglish",
        })
      );
    });
  });
});
