import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LanguageProcessingSection } from "../components/captions/LanguageProcessingSection";
import { api } from "../lib/api";
import type {
  TranscriptionResult,
  LanguageProcessingResponse,
} from "../types/caption";

// Mock API client
vi.mock("../lib/api", () => ({
  api: {
    processLanguage: vi.fn(),
    getLanguagePairs: vi.fn(),
  },
}));

const mockEnglishTranscription: TranscriptionResult = {
  language: "English",
  language_code: "en",
  is_transliteration: false,
  script_type: "Latin",
  full_text:
    "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.\n\n60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
  segments: [
    {
      id: "seg_0",
      text: "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.",
      start_time: 0.0,
      end_time: 3.5,
      words: [{ text: "Stop", start_time: 0.0, end_time: 0.3 }],
      speaker: "Speaker 1",
      confidence: 0.95,
    },
    {
      id: "seg_1",
      text: "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
      start_time: 3.8,
      end_time: 7.5,
      words: [{ text: "60fps", start_time: 3.8, end_time: 4.1 }],
      speaker: "Speaker 1",
      confidence: 0.92,
    },
  ],
  duration_seconds: 7.5,
  provider_name: "test_provider",
  is_production_provider: false,
};

const mockTeluguTranscription: TranscriptionResult = {
  language: "Telugu",
  language_code: "te",
  is_transliteration: false,
  script_type: "Telugu",
  full_text: "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపిస్తుంది.",
  segments: [
    {
      id: "seg_0",
      text: "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపిస్తుంది.",
      start_time: 0.0,
      end_time: 3.5,
      words: [],
      confidence: 0.96,
    },
  ],
  duration_seconds: 3.5,
  provider_name: "test_provider",
  is_production_provider: false,
};

const mockTranslationResponse: LanguageProcessingResponse = {
  result: {
    source_language: "English",
    target_language: "Telugu",
    target_language_code: "te",
    is_transliteration: false,
    script_type: "Telugu",
    processing_mode: "translation",
    segments: [
      {
        id: "seg_0",
        original_text:
          "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.",
        text: "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపించేలా చేసే 1-సెకన్ కెమెరా సెట్టింగ్ ఇది.",
        start_time: 0.0,
        end_time: 3.5,
        words: [],
        confidence: 0.94,
      },
      {
        id: "seg_1",
        original_text:
          "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
        text: "60fps ఆర్గానిక్ మోషన్ బ్లర్ లేకుండా కఠినమైన, అసహజమైన సోప్ ఒపెరా ఎఫెక్ట్‌ను సృష్టిస్తుంది.",
        start_time: 3.8,
        end_time: 7.5,
        words: [],
        confidence: 0.92,
      },
    ],
    full_text:
      "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపించేలా చేసే 1-సెకన్ కెమెరా సెట్టింగ్ ఇది.\n\n60fps ఆర్గానిక్ మోషన్ బ్లర్ లేకుండా కఠినమైన, అసహజమైన సోప్ ఒపెరా ఎఫెక్ట్‌ను సృష్టిస్తుంది.",
    original_full_text: mockEnglishTranscription.full_text,
    provider_name: "development_mock_language_processor",
    is_production_provider: false,
    word_timings_available: false,
    notice:
      "Development Language Processing Mode — production language processor is not configured. Output is simulated for development/testing.",
  },
  notice:
    "Development Language Processing Mode — production language processor is not configured. Output is simulated for development/testing.",
};

const mockTanglishResponse: LanguageProcessingResponse = {
  result: {
    source_language: "Telugu",
    target_language: "Tanglish",
    target_language_code: "te-Latn",
    is_transliteration: true,
    script_type: "Latin",
    processing_mode: "transliteration",
    segments: [
      {
        id: "seg_0",
        original_text: "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపిస్తుంది.",
        text: "60fps lo shoot cheyadam aapandi! mobile footage cinema laaga kanipisthundi.",
        start_time: 0.0,
        end_time: 3.5,
        words: [],
        confidence: 0.95,
      },
    ],
    full_text: "60fps lo shoot cheyadam aapandi! mobile footage cinema laaga kanipisthundi.",
    original_full_text: mockTeluguTranscription.full_text,
    provider_name: "development_mock_language_processor",
    is_production_provider: false,
    word_timings_available: false,
    notice:
      "Development Language Processing Mode — production language processor is not configured. Output is simulated for development/testing.",
  },
  notice:
    "Development Language Processing Mode — production language processor is not configured. Output is simulated for development/testing.",
};

describe("Caption Studio — Language Processing (Translation & Transliteration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders LanguageProcessingSection with source language info and valid translation targets for English", () => {
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockEnglishTranscription}
        activeTranscription={mockEnglishTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    expect(
      screen.getByText("5. Multi-Lingual Translation & Transliteration")
    ).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Translation ≠ Transliteration")).toBeInTheDocument();

    // Valid translation targets for English
    expect(screen.getByRole("button", { name: /^Telugu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hindi/i })).toBeInTheDocument();
    // Tanglish should NOT be a translation option
    expect(screen.queryByText(/Tanglish \(Telugu in Latin script\)/i)).not.toBeInTheDocument();
  });

  it("handles Telugu source language with Transliteration mode defaulting to Tanglish", () => {
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockTeluguTranscription}
        activeTranscription={mockTeluguTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    expect(screen.getByText("Telugu")).toBeInTheDocument();

    // Telugu defaults to transliteration mode
    expect(
      screen.getByText(/Tanglish \(Telugu in Latin script\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Romanized \(te-Latn\)/i)).toBeInTheDocument();
  });

  it("prevents transliteration for English source with clear explanation", () => {
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockEnglishTranscription}
        activeTranscription={mockEnglishTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    // Switch to transliteration
    const translitBtn = screen.getByRole("button", { name: /Transliteration/i });
    fireEvent.click(translitBtn);

    expect(
      screen.getByText(
        /Transliteration is supported for native Telugu script into Tanglish \(te-Latn\)/i
      )
    ).toBeInTheDocument();
  });

  it("submits translation request, displays loading state, and renders comparison with preserved timestamps", async () => {
    vi.mocked(api.processLanguage).mockResolvedValue(mockTranslationResponse);
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockEnglishTranscription}
        activeTranscription={mockEnglishTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    // Click translate button
    const translateBtn = screen.getByRole("button", { name: /Translate to Telugu/i });
    fireEvent.click(translateBtn);

    expect(screen.getByText(/Translating Speech Segments.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.processLanguage).toHaveBeenCalledWith({
        source_language: "English",
        target_language: "Telugu",
        processing_mode: "translation",
        segments: mockEnglishTranscription.segments,
        full_text: mockEnglishTranscription.full_text,
        provider: "mock",
      });

      expect(
        screen.getByText("Development Language Processing Mode")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Apply as Active Captions")
      ).toBeInTheDocument();
    });

    // Check that immutable timestamps are preserved
    expect(screen.getByText(/00:00.000 → 00:03.500/i)).toBeInTheDocument();
    expect(screen.getByText(/00:03.800 → 00:07.500/i)).toBeInTheDocument();

    // Check translated text content
    expect(
      screen.getByText(/60fps లో షూట్ చేయడం ఆపండి!/i)
    ).toBeInTheDocument();
  });

  it("submits transliteration request for Telugu -> Tanglish and displays Romanized Latin output", async () => {
    vi.mocked(api.processLanguage).mockResolvedValue(mockTanglishResponse);
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockTeluguTranscription}
        activeTranscription={mockTeluguTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    const translitBtn = screen.getByRole("button", { name: /Transliterate to Tanglish/i });
    fireEvent.click(translitBtn);

    await waitFor(() => {
      expect(api.processLanguage).toHaveBeenCalledWith({
        source_language: "Telugu",
        target_language: "Tanglish",
        processing_mode: "transliteration",
        segments: mockTeluguTranscription.segments,
        full_text: mockTeluguTranscription.full_text,
        provider: "mock",
      });

      expect(
        screen.getByText(/60fps lo shoot cheyadam aapandi!/i)
      ).toBeInTheDocument();
      expect(screen.getByText("Transliterated (Tanglish)")).toBeInTheDocument();
    });
  });

  it("allows switching between Side-by-Side, Processed Only, and Original Only view modes", async () => {
    vi.mocked(api.processLanguage).mockResolvedValue(mockTranslationResponse);
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockEnglishTranscription}
        activeTranscription={mockEnglishTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Translate to Telugu/i }));
    await waitFor(() => {
      expect(screen.getByText("Apply as Active Captions")).toBeInTheDocument();
    });

    // In side-by-side mode, both original and processed cards exist
    expect(screen.getByTestId("seg-original-0")).toBeInTheDocument();
    expect(screen.getByTestId("seg-processed-0")).toBeInTheDocument();

    // Click Processed Only
    const processedOnlyBtn = screen.getByRole("button", { name: /Processed \(Telugu\)/i });
    fireEvent.click(processedOnlyBtn);

    // In processed only, original segment card is not rendered
    expect(screen.queryByTestId("seg-original-0")).not.toBeInTheDocument();
    expect(screen.getByTestId("seg-processed-0")).toBeInTheDocument();

    // Click Original Only
    const origOnlyBtn = screen.getByRole("button", { name: /Original \(English\)/i });
    fireEvent.click(origOnlyBtn);

    expect(screen.getByTestId("seg-original-0")).toBeInTheDocument();
    expect(screen.queryByTestId("seg-processed-0")).not.toBeInTheDocument();
  });

  it("applies processed version to active captions and preserves original transcript in state", async () => {
    vi.mocked(api.processLanguage).mockResolvedValue(mockTranslationResponse);
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockEnglishTranscription}
        activeTranscription={mockEnglishTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Translate to Telugu/i }));
    await waitFor(() => {
      expect(screen.getByText("Apply as Active Captions")).toBeInTheDocument();
    });

    // Click Apply
    const applyBtn = screen.getByRole("button", { name: /Apply as Active Captions/i });
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledTimes(1);
    const updated = handleApply.mock.calls[0][0];
    expect(updated.language).toBe("Telugu");
    expect(updated.language_code).toBe("te");
    expect(updated.segments[0].text).toContain("60fps లో షూట్ చేయడం ఆపండి!");
    // Timestamps preserved
    expect(updated.segments[0].start_time).toBe(0.0);
    expect(updated.segments[0].end_time).toBe(3.5);
    // Word timings marked empty/unavailable
    expect(updated.segments[0].words).toEqual([]);

    // Check confirmation banner
    expect(
      screen.getByText(/Processed transcript applied as active captions!/i)
    ).toBeInTheDocument();
  });

  it("reverts active captions back to original transcript when Revert button is clicked", () => {
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockEnglishTranscription}
        activeTranscription={{
          ...mockEnglishTranscription,
          language: "Telugu",
        }}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={true}
      />
    );

    // Revert button should be present
    const revertBtn = screen.getByRole("button", {
      name: /Revert to Original \(English\)/i,
    });
    expect(revertBtn).toBeInTheDocument();

    fireEvent.click(revertBtn);
    expect(handleRevert).toHaveBeenCalledTimes(1);
  });

  it("displays alert and prevents submission when production engine is unconfigured", () => {
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockEnglishTranscription}
        activeTranscription={mockEnglishTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    // Select OpenAI Engine
    const prodBtn = screen.getByRole("button", { name: /OpenAI Engine/i });
    fireEvent.click(prodBtn);

    // Alert should be displayed
    expect(
      screen.getByText(
        /Production language processing is not configured. Configure the provider credentials or switch to Development Mode./i
      )
    ).toBeInTheDocument();

    // Click Process
    const processBtn = screen.getByRole("button", { name: /Translate to Telugu/i });
    fireEvent.click(processBtn);

    expect(api.processLanguage).not.toHaveBeenCalled();
  });

  it("gracefully displays error banner when language processing API fails", async () => {
    vi.mocked(api.processLanguage).mockRejectedValue(
      new Error("Translation provider timed out after 45 seconds.")
    );
    const handleApply = vi.fn();
    const handleRevert = vi.fn();

    render(
      <LanguageProcessingSection
        originalTranscription={mockEnglishTranscription}
        activeTranscription={mockEnglishTranscription}
        isProductionConfigured={false}
        onApplyProcessed={handleApply}
        onRevertOriginal={handleRevert}
        isProcessedActive={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Translate to Telugu/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Translation provider timed out after 45 seconds/i)
      ).toBeInTheDocument();
    });
  });
});
