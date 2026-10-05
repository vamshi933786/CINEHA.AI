import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProfileForm } from "../components/profile/ProfileForm";
import { ProfileSummaryCard } from "../components/profile/ProfileSummaryCard";
import { CompletenessCard } from "../components/profile/CompletenessCard";
import { PersonaPreviewPanel } from "../components/profile/PersonaPreviewPanel";
import { TagListManager } from "../components/profile/TagListManager";
import type {
  CreatorProfile,
  ProfileCompleteness,
  PersonaPreviewResponse,
} from "../types/creatorProfile";

const mockProfile: CreatorProfile = {
  id: "test-profile-1",
  creator_name: "Sai Panga",
  display_name: "@saipanga",
  creator_type: "Filmmaker",
  location: "Hyderabad, India",
  niche: "Cinematography",
  secondary_niches: ["Color Grading", "Mobile Lighting"],
  content_pillars: ["Camera Angles", "Cinematic LUTs"],
  topics_to_avoid: ["Politics"],
  target_audience: "Aspiring mobile filmmakers",
  target_audience_age: "18–24",
  audience_sophistication: "Intermediate",
  audience_interests: ["DaVinci Resolve", "Anamorphic lenses"],
  audience_pain_points: ["Flat lighting", "Shaky footage"],
  platforms: ["Instagram Reels", "YouTube Shorts"],
  primary_language: "Tanglish",
  secondary_languages: ["Telugu"],
  script_preference: "Tanglish / Romanized Telugu",
  preferred_aspect_ratio: "9:16",
  typical_duration: "45 sec",
  cta_style: "Save",
  secondary_cta_styles: ["Follow"],
  content_tones: ["Educational", "Cinematic"],
  energy: "High-energy",
  humor: "Light",
  storytelling_style: "Story-driven",
  vocabulary: "Balanced",
  creator_bio: "Filmmaker & creator",
  content_goals: ["Increase retention", "Build personal brand"],
  brand_positioning: "Practical mobile filmmaking without cinema cameras",
  core_message: "Tell big stories with small gear",
  words_to_use: ["Cinema look", "Frame cheddam"],
  words_to_avoid: ["Don't forget to like"],
  style_rules: ["Hook in first 2 seconds"],
  created_at: "2026-09-28T12:00:00Z",
  updated_at: "2026-09-28T12:00:00Z",
};

const mockCompleteness: ProfileCompleteness = {
  score: 85,
  categories: [
    { category: "Identity & Bio", completed: true, weight: 15, details: "Complete" },
    { category: "Niche & Content Pillars", completed: true, weight: 20, details: "Complete" },
    { category: "Target Audience", completed: true, weight: 20, details: "Complete" },
    { category: "Voice & Delivery Style", completed: true, weight: 15, details: "Complete" },
    { category: "Language & Script Preference", completed: true, weight: 10, details: "Complete" },
    { category: "Target Platforms", completed: true, weight: 10, details: "Complete" },
    { category: "Brand Guidance & CTA", completed: false, weight: 10, details: "Pending" },
  ],
  recommendations: ["Define your signature brand style rules."],
};

const mockPreview: PersonaPreviewResponse = {
  summary: "Sai Panga creates high-energy educational content for aspiring filmmakers in Tanglish.",
  example_hook: "Meeru mobile lo cinema look thevali anukuntunnara? Watch this.",
  example_intro: "Hey creators, nenu Sai. Today we are fixing flat lighting.",
  example_cta: "Ee guide use ayithe save cheyandi!",
  is_ai_generated: false,
};

describe("Creator Profile Components", () => {
  describe("ProfileSummaryCard", () => {
    it("renders ProfileSummaryCard with creator persona details", () => {
      const handleEdit = vi.fn();
      render(<ProfileSummaryCard profile={mockProfile} onEdit={handleEdit} />);

      expect(screen.getByText("Sai Panga")).toBeInTheDocument();
      expect(screen.getByText("@saipanga")).toBeInTheDocument();
      expect(screen.getByText("Filmmaker")).toBeInTheDocument();
      expect(screen.getByText(/Cinematography/)).toBeInTheDocument();
      expect(screen.getByText("Tanglish")).toBeInTheDocument();
      expect(screen.getByText("Instagram Reels")).toBeInTheDocument();
      expect(screen.getByText("Educational")).toBeInTheDocument();
      expect(screen.getByText("Camera Angles")).toBeInTheDocument();
      expect(screen.getByText("Cinema look")).toBeInTheDocument();

      const editBtn = screen.getByRole("button", { name: /edit profile/i });
      fireEvent.click(editBtn);
      expect(handleEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe("ProfileForm", () => {
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

      const form = screen.getByTestId("profile-form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getAllByText(/creator name is required/i)[0]
        ).toBeInTheDocument();
        expect(
          screen.getAllByText(/select at least one target platform/i)[0]
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
            creator_type: "Filmmaker",
          })
        );
      });
    });

    it("switches section tabs smoothly", () => {
      render(<ProfileForm initialData={mockProfile} onSave={vi.fn()} />);

      // Default tab is Identity
      expect(screen.getByText("Creator Archetype")).toBeInTheDocument();

      // Switch to Content tab
      const contentTabBtn = screen.getByRole("button", { name: /content & pillars/i });
      fireEvent.click(contentTabBtn);
      expect(screen.getByText("Primary Content Niche")).toBeInTheDocument();
      expect(screen.getByText("Core Content Pillars")).toBeInTheDocument();

      // Switch to Audience tab
      const audienceTabBtn = screen.getByRole("button", { name: /target audience/i });
      fireEvent.click(audienceTabBtn);
      expect(screen.getByText("Audience Summary")).toBeInTheDocument();
      expect(screen.getByText("Primary Age Demographic")).toBeInTheDocument();

      // Switch to Voice tab
      const voiceTabBtn = screen.getByRole("button", { name: /voice & style/i });
      fireEvent.click(voiceTabBtn);
      expect(screen.getByText("Content Delivery Tones")).toBeInTheDocument();
      expect(screen.getByText("Energy / Pacing")).toBeInTheDocument();

      // Switch to Brand tab
      const brandTabBtn = screen.getByRole("button", { name: /brand guidance/i });
      fireEvent.click(brandTabBtn);
      expect(screen.getByText("Brand Positioning Statement")).toBeInTheDocument();
      expect(screen.getByText("Signature Words & Catchphrases to Use")).toBeInTheDocument();
    });

    it("resets dirty changes when Reset button is clicked", () => {
      render(<ProfileForm initialData={mockProfile} onSave={vi.fn()} />);

      const nameInput = screen.getByLabelText(/creator name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "Changed Name" } });
      expect(nameInput.value).toBe("Changed Name");

      const resetBtn = screen.getByRole("button", { name: /reset changes/i });
      fireEvent.click(resetBtn);
      expect(nameInput.value).toBe("Sai Panga");
    });
  });

  describe("TagListManager", () => {
    it("adds a tag and prevents duplicates", () => {
      const handleChange = vi.fn();
      render(
        <TagListManager
          label="Content Pillars"
          tags={["Lighting", "Camera"]}
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText(/press enter/i);
      fireEvent.change(input, { target: { value: "Sound" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(handleChange).toHaveBeenCalledWith(["Lighting", "Camera", "Sound"]);

      // Try duplicate
      fireEvent.change(input, { target: { value: "lighting" } });
      fireEvent.keyDown(input, { key: "Enter" });
      // Should not add duplicate
      expect(handleChange).not.toHaveBeenCalledWith(["Lighting", "Camera", "lighting"]);
    });

    it("removes an existing tag when delete button is clicked", () => {
      const handleChange = vi.fn();
      render(
        <TagListManager
          label="Content Pillars"
          tags={["Lighting", "Camera"]}
          onChange={handleChange}
        />
      );

      const removeBtn = screen.getByRole("button", { name: /remove Lighting/i });
      fireEvent.click(removeBtn);
      expect(handleChange).toHaveBeenCalledWith(["Camera"]);
    });
  });

  describe("CompletenessCard", () => {
    it("renders score progress and recommendations", () => {
      render(<CompletenessCard completeness={mockCompleteness} />);

      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByText(/AI-Optimized/i)).toBeInTheDocument();
      expect(screen.getByText(/Define your signature brand style rules/i)).toBeInTheDocument();
    });
  });

  describe("PersonaPreviewPanel", () => {
    it("renders simulated persona, hook, intro, and CTA", () => {
      const handleGenerate = vi.fn().mockResolvedValue(undefined);
      render(
        <PersonaPreviewPanel
          preview={mockPreview}
          onGenerateSummary={handleGenerate}
        />
      );

      expect(screen.getByText(/Sai Panga creates high-energy educational content/i)).toBeInTheDocument();
      expect(screen.getByText(/Meeru mobile lo cinema look thevali/i)).toBeInTheDocument();
      expect(screen.getByText(/Hey creators, nenu Sai/i)).toBeInTheDocument();
      expect(screen.getByText(/Ee guide use ayithe save cheyandi!/i)).toBeInTheDocument();

      const genBtn = screen.getByRole("button", { name: /generate ai persona summary/i });
      fireEvent.click(genBtn);
      expect(handleGenerate).toHaveBeenCalledTimes(1);
    });
  });
});
