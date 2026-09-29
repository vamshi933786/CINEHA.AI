import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UnifiedScriptInput } from "@/components/scripts/UnifiedScriptInput";
import { RetentionWorkspace } from "@/components/analyzer/RetentionWorkspace";
import { setOCRProvider, MockClientOCRProvider } from "@/lib/ocr/ocrProvider";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    analyzeScript: vi.fn(),
    analyzeScriptById: vi.fn(),
    extractScript: vi.fn(),
    saveImportedScript: vi.fn(),
    getScripts: vi.fn().mockResolvedValue([]),
  },
}));

const defaultMockAnalysis = {
  script_id: "sample-id",
  title: "Why 24fps Feels Like Cinema",
  overall_score: 87,
  overall_rating: "Excellent Retention Potential",
  hook_clarity: { score: 90, rating: "Excellent", explanation: "Sharp opening hook" },
  hook_strength: { score: 88, rating: "Strong", explanation: "High curiosity" },
  pacing_progression: { score: 85, rating: "Optimal", explanation: "Steady pace" },
  information_density: { score: 86, rating: "Dense", explanation: "Good info" },
  filler_repetition: { score: 92, rating: "Clean", explanation: "No fluff" },
  segment_timing: { score: 84, rating: "Balanced", explanation: "Timed beats" },
  curiosity_open_loops: { score: 88, rating: "Engaging", explanation: "Open loops" },
  cta_strength: { score: 82, rating: "Actionable", explanation: "Direct CTA" },
  overall_retention_potential: { score: 87, rating: "Viral", explanation: "High potential" },
  weak_points: ["Slight pause around 0:10"],
  recommendations: ["Trim second transition"],
  segment_observations: [
    {
      segment_id: "seg_1",
      time_range: "0:00–0:03",
      section: "HOOK",
      observation: "Great hook",
      retention_risk: "low" as const,
      suggestion: null,
    },
  ],
  metrics: {
    total_word_count: 55,
    words_per_second: 2.5,
    pacing_assessment: "Optimal",
    detected_filler_words: [],
    hook_duration_seconds: 3.0,
    cta_duration_seconds: 3.0,
  },
  analyzed_at: new Date().toISOString(),
  provider_used: "heuristic_mock",
};

describe("UnifiedScriptInput Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOCRProvider(new MockClientOCRProvider());
    vi.mocked(api.analyzeScript).mockResolvedValue(defaultMockAnalysis);
    vi.mocked(api.getScripts).mockResolvedValue([]);
    if (typeof global.URL.createObjectURL !== "function") {
      global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-preview");
    }
    if (typeof global.URL.revokeObjectURL !== "function") {
      global.URL.revokeObjectURL = vi.fn();
    }
  });

  // ===================================================================
  // TEXT INPUT TESTS
  // ===================================================================

  it("renders with Paste Text as the default input mode", () => {
    render(<UnifiedScriptInput onAnalyzeScript={vi.fn()} />);

    expect(screen.getByText("Provide Script")).toBeInTheDocument();
    expect(screen.getByText("Paste Text")).toBeInTheDocument();
    expect(screen.getByText("Upload PDF")).toBeInTheDocument();
    expect(screen.getByText("Upload DOCX")).toBeInTheDocument();
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste or type your script here/i)).toBeInTheDocument();
  });

  it("calculates character and word count in real time", () => {
    render(<UnifiedScriptInput onAnalyzeScript={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/Paste or type your script here/i);
    fireEvent.change(textarea, {
      target: { value: "Stop shooting at 60fps! Here is the cinema secret." },
    });

    expect(screen.getByText("9 words")).toBeInTheDocument();
    expect(screen.getByText("50 characters")).toBeInTheDocument();
  });

  it("validates against empty text when attempting to analyze", async () => {
    const mockAnalyze = vi.fn();
    render(<UnifiedScriptInput onAnalyzeScript={mockAnalyze} />);

    const analyzeBtn = screen.getByRole("button", { name: /Analyze Script/i });
    expect(analyzeBtn).toBeDisabled();
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it("calls onAnalyzeScript with normalized text payload upon submission", async () => {
    const mockAnalyze = vi.fn();
    render(<UnifiedScriptInput onAnalyzeScript={mockAnalyze} />);

    const textarea = screen.getByPlaceholderText(/Paste or type your script here/i);
    fireEvent.change(textarea, {
      target: { value: "Line 1: Hook.\n\nLine 2: Story.\n\nLine 3: CTA." },
    });

    const titleInput = screen.getByPlaceholderText(/e\.g\. 24fps Cinematography/i);
    fireEvent.change(titleInput, { target: { value: "My Cinematic Reel" } });

    const analyzeBtn = screen.getByRole("button", { name: /Analyze Script/i });
    expect(analyzeBtn).not.toBeDisabled();
    fireEvent.click(analyzeBtn);

    expect(mockAnalyze).toHaveBeenCalledTimes(1);
    const [payload, title] = mockAnalyze.mock.calls[0];
    expect(title).toBe("My Cinematic Reel");
    expect(payload.sourceType).toBe("text");
    expect(payload.text).toBe("Line 1: Hook.\n\nLine 2: Story.\n\nLine 3: CTA.");
    expect(payload.extractionMethod).toBe("direct_input");
  });

  // ===================================================================
  // PDF INPUT TESTS
  // ===================================================================

  it("switches to Upload PDF mode and handles PDF extraction", async () => {
    const mockExtract = vi.spyOn(api, "extractScript").mockResolvedValueOnce({
      source_type: "pdf",
      text: "Extracted PDF Screenplay: Hook, Body, and Call to action.",
      original_file_name: "screenplay.pdf",
      language: "English",
      extraction_method: "pypdf_stream_parser",
      confidence: 0.98,
      provider_name: "pypdf",
      is_production_ocr: true,
      character_count: 57,
      word_count: 9,
      metadata: { total_pages: 1 },
    });

    render(<UnifiedScriptInput onAnalyzeScript={vi.fn()} />);

    // Switch to PDF tab
    fireEvent.click(screen.getByText("Upload PDF"));
    expect(screen.getAllByText(/Screenplay documents/i).length).toBeGreaterThan(0);

    // Create a mock file
    const file = new File(["dummy pdf binary content"], "screenplay.pdf", {
      type: "application/pdf",
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockExtract).toHaveBeenCalledTimes(1);
    });

    // Check that extracted text is loaded into editable editor
    const textarea = screen.getByDisplayValue(/Extracted PDF Screenplay/i);
    expect(textarea).toBeInTheDocument();
  });

  it("handles PDF extraction failure and allows switching to Paste Text", async () => {
    vi.spyOn(api, "extractScript").mockRejectedValueOnce(
      new Error("PDF contains no readable digital text.")
    );

    render(<UnifiedScriptInput onAnalyzeScript={vi.fn()} />);

    fireEvent.click(screen.getByText("Upload PDF"));
    const file = new File(["scanned image"], "scanned.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/PDF contains no readable digital text/i)).toBeInTheDocument();
    });

    // Non-trapping check: creator can switch to Paste Text
    const switchBtn = screen.getByRole("button", { name: /Switch to Paste Text/i });
    fireEvent.click(switchBtn);

    expect(screen.getByPlaceholderText(/Paste or type your script here/i)).toBeInTheDocument();
  });

  // ===================================================================
  // DOCX INPUT TESTS
  // ===================================================================

  it("switches to Upload DOCX mode and handles Word document extraction", async () => {
    vi.spyOn(api, "extractScript").mockResolvedValueOnce({
      source_type: "docx",
      text: "Extracted DOCX Screenplay paragraph.",
      original_file_name: "draft.docx",
      language: "English",
      extraction_method: "openxml_paragraph_parser",
      confidence: 1.0,
      provider_name: "openxml_native",
      is_production_ocr: true,
      character_count: 36,
      word_count: 5,
      metadata: {},
    });

    render(<UnifiedScriptInput onAnalyzeScript={vi.fn()} />);

    fireEvent.click(screen.getByText("Upload DOCX"));
    const file = new File(["docx zip content"], "draft.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Extracted DOCX Screenplay/i)).toBeInTheDocument();
    });
  });

  // ===================================================================
  // IMAGE & OCR INPUT TESTS
  // ===================================================================

  it("switches to Upload Image mode, displays image preview, and extracts OCR text", async () => {
    render(<UnifiedScriptInput onAnalyzeScript={vi.fn()} />);

    fireEvent.click(screen.getByText("Upload Image"));
    expect(screen.getAllByText(/Screenshots, whiteboard notes/i).length).toBeGreaterThan(0);

    const file = new File(["fake image bits"], "storyboard.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText("Script screenshot preview")).toBeInTheDocument();
    });

    // Check OCR output in editable editor
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Stop shooting at 60fps!/i)).toBeInTheDocument();
    });

    // Verify development mode notification is visible
    expect(screen.getByText(/Development OCR Mode/i)).toBeInTheDocument();
  });

  it("allows creator to edit and correct OCR mistakes before analysis", async () => {
    const mockAnalyze = vi.fn();
    render(<UnifiedScriptInput onAnalyzeScript={mockAnalyze} />);

    fireEvent.click(screen.getByText("Upload Image"));
    const file = new File(["img bytes"], "notes.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Stop shooting at 60fps!/i)).toBeInTheDocument();
    });

    // Creator edits the OCR text
    const editor = screen.getByDisplayValue(/Stop shooting at 60fps!/i);
    fireEvent.change(editor, {
      target: {
        value: "Corrected Hook: 24fps gives cinematic organic blur. Save this advice!",
      },
    });

    expect(screen.getByDisplayValue(/Corrected Hook: 24fps gives/i)).toBeInTheDocument();

    // Click Analyze Script
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Script/i });
    fireEvent.click(analyzeBtn);

    expect(mockAnalyze).toHaveBeenCalledTimes(1);
    const [payload] = mockAnalyze.mock.calls[0];
    expect(payload.sourceType).toBe("image");
    expect(payload.text).toBe("Corrected Hook: 24fps gives cinematic organic blur. Save this advice!");
  });

  it("rejects oversized files exceeding 10MB limit", async () => {
    render(<UnifiedScriptInput onAnalyzeScript={vi.fn()} />);

    fireEvent.click(screen.getByText("Upload Image"));
    // Create a 12 MB fake file
    const largeFile = new File([new ArrayBuffer(12 * 1024 * 1024)], "huge.png", {
      type: "image/png",
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/exceeds the 10 MB limit/i)).toBeInTheDocument();
    });
  });

  it("saves imported script to Studio and displays confirmation with studio link", async () => {
    const mockSave = vi.spyOn(api, "saveImportedScript").mockResolvedValueOnce({
      id: "script-uuid-12345",
      title: "My Imported Script",
      topic: "Cinematography",
      platform: "Instagram Reels",
      language: "English",
      duration_seconds: 30,
      tone: "Cinematic",
      hook: "Stop shooting at 60fps!",
      segments: [],
      cta: "Save this!",
      provider_used: "unified_input_import",
      current_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    render(<UnifiedScriptInput onAnalyzeScript={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/Paste or type your script here/i);
    fireEvent.change(textarea, { target: { value: "My raw screenplay lines to save." } });

    const saveBtn = screen.getByRole("button", { name: /Save to Studio/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Script saved to Studio as Version 1!/i)).toBeInTheDocument();
      expect(screen.getByText(/Open in Studio/i)).toBeInTheDocument();
    });
  });

  // ===================================================================
  // RETENTION WORKSPACE INTEGRATION TEST
  // ===================================================================

  it("integrates seamlessly into RetentionWorkspace and runs 9-dimension analysis on unified script input", async () => {
    const mockAnalyze = vi.spyOn(api, "analyzeScript").mockResolvedValue({
      script_id: null,
      title: "Custom Uploaded Script",
      overall_score: 87,
      overall_rating: "Excellent Retention Potential",
      hook_clarity: { score: 90, rating: "Excellent", explanation: "Sharp opening hook" },
      hook_strength: { score: 88, rating: "Strong", explanation: "High curiosity" },
      pacing_progression: { score: 85, rating: "Optimal", explanation: "Steady pace" },
      information_density: { score: 86, rating: "Dense", explanation: "Good info" },
      filler_repetition: { score: 92, rating: "Clean", explanation: "No fluff" },
      segment_timing: { score: 84, rating: "Balanced", explanation: "Timed beats" },
      curiosity_open_loops: { score: 88, rating: "Engaging", explanation: "Open loops" },
      cta_strength: { score: 82, rating: "Actionable", explanation: "Direct CTA" },
      overall_retention_potential: { score: 87, rating: "Viral", explanation: "High potential" },
      weak_points: ["Slight pause around 0:10"],
      recommendations: ["Trim second transition"],
      segment_observations: [
        {
          segment_id: "seg_1",
          time_range: "0:00–0:03",
          section: "HOOK",
          observation: "Great hook",
          retention_risk: "low",
          suggestion: null,
        },
      ],
      metrics: {
        total_word_count: 55,
        words_per_second: 2.5,
        pacing_assessment: "Optimal",
        detected_filler_words: [],
        hook_duration_seconds: 3.0,
        cta_duration_seconds: 3.0,
      },
      analyzed_at: new Date().toISOString(),
      provider_used: "heuristic_mock",
    });

    render(<RetentionWorkspace />);

    // Wait for initial viral load to finish
    await waitFor(() => {
      expect(screen.getByText("Excellent Retention Potential")).toBeInTheDocument();
    });

    // Switch from "Saved Scripts & Presets" to "Upload / Paste Script (OCR)"
    const uploadTab = screen.getByRole("button", { name: /Upload \/ Paste Script \(OCR\)/i });
    fireEvent.click(uploadTab);

    // Provide script text in UnifiedScriptInput
    const textarea = screen.getByPlaceholderText(/Paste or type your script here/i);
    fireEvent.change(textarea, {
      target: {
        value: "Stop shooting at 60fps! Here is the 1-second setting. Switch to 24fps. Save this!",
      },
    });

    // Ensure Analyze button is enabled and click
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Script/i });
    expect(analyzeBtn).not.toBeDisabled();
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledTimes(2);
    });

    const calledPayload = mockAnalyze.mock.calls[1][0];
    expect(calledPayload.script_text).toContain("Stop shooting at 60fps!");
    expect(calledPayload.source_type).toBe("text");

    // Verify retention dashboard displays results
    await waitFor(() => {
      expect(screen.getAllByText("87")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Excellent Retention Potential")[0]).toBeInTheDocument();
    });
  });
});
