import type { OCRResult } from "@/types/scriptInput";
import { api } from "../api";

export interface OCRProvider {
  extractText(file: File, language?: string): Promise<OCRResult>;
}

export class DefaultOCRProvider implements OCRProvider {
  async extractText(file: File, language: string = "English"): Promise<OCRResult> {
    try {
      const result = await api.extractScript({
        file,
        sourceType: "image",
        language,
      });

      return {
        extractedText: result.text,
        confidence: result.confidence ?? 0.9,
        lines: result.text.split("\n").filter((l) => l.trim().length > 0),
        providerName: result.provider_name,
        isProduction: result.is_production_ocr,
        metadata: result.metadata,
      };
    } catch (err: any) {
      return {
        extractedText: "",
        confidence: 0,
        providerName: "api_ocr",
        isProduction: false,
        error: err.message || "Failed to extract text from image.",
      };
    }
  }
}

export class MockClientOCRProvider implements OCRProvider {
  private fallbackText: string;

  constructor(fallbackText?: string) {
    this.fallbackText =
      fallbackText ||
      "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.\n\nSwitch to 24fps with a 180-degree shutter angle.\n\nSave this before your next shoot!";
  }

  async extractText(file: File, language: string = "English"): Promise<OCRResult> {
    // Basic verification of image MIME type
    if (!file.type.startsWith("image/")) {
      return {
        extractedText: "",
        confidence: 0,
        providerName: "mock_client_ocr",
        isProduction: false,
        error: `Invalid file type '${file.type}'. Expected image file.`,
      };
    }

    if (file.size === 0) {
      return {
        extractedText: "",
        confidence: 0,
        providerName: "mock_client_ocr",
        isProduction: false,
        error: "Image file is empty (0 bytes).",
      };
    }

    // Simulate async OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    let text = this.fallbackText;
    if (language === "Telugu") {
      text =
        "మీరు 60fps లో షూట్ చేయడం ఆపేయండి! మొబైల్ వీడియోలు సినిమాటిక్ గా రావాలంటే 24fps కి మారండి.\n\nమీ తర్వాతి షూట్ కోసం సేవ్ చేసుకోండి!";
    } else if (language === "Tanglish") {
      text =
        "Stop shooting at 60fps! Cinema feel kavali ante 24fps lock cheyandi.\n\nSave this for your next video shoot!";
    }

    return {
      extractedText: text,
      confidence: 0.92,
      lines: text.split("\n").filter((l) => l.trim().length > 0),
      providerName: "mock_client_ocr",
      isProduction: false,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type,
        note: "Development OCR Mode (mock/heuristic) — No production cloud vision API key is configured.",
      },
    };
  }
}

let activeProvider: OCRProvider = new DefaultOCRProvider();

export function getOCRProvider(): OCRProvider {
  return activeProvider;
}

export function setOCRProvider(provider: OCRProvider): void {
  activeProvider = provider;
}
