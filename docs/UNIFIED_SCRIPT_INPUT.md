# Unified Script Input & OCR Architecture

## Overview
CINEHA AI creators can provide scripts through four distinct input modalities:
1. **Direct Text Input**: Paste or type screenplay directly into an auto-sizing editor.
2. **PDF Documents (`.pdf`)**: Native stream parsing via `pypdf` extracting textual content.
3. **Word Documents (`.docx`)**: OpenXML XML paragraph extraction (`word/document.xml`) preserving structure without external heavy dependencies.
4. **Image / Screenshot (`.png`, `.jpg`, `.jpeg`, `.webp`)**: OCR extraction abstraction with development fallback and language awareness.

All modalities normalize into standard editable screenplay text before flowing into the existing **Script Retention Analyzer Agent** (9 retention dimensions) or being saved to **Script Studio** as Version 1.

---

## 1. Normalization Contract

Every input format is normalized into the following schema (`NormalizedScriptResponse`):

```typescript
interface NormalizedScriptResponse {
  source_type: "text" | "pdf" | "docx" | "image";
  text: string;
  original_file_name?: string | null;
  language: "English" | "Telugu" | "Tanglish";
  extraction_method: string;
  confidence?: number;
  provider_name?: string;
  is_production_ocr: boolean;
  character_count: number;
  word_count: number;
  metadata?: Record<string, any>;
}
```

---

## 2. OCR Architecture & Abstraction

### Provider Hierarchy (`apps/api/app/services/ocr_provider.py`)
- **`BaseOCRProvider`**: Abstract interface declaring `async extract_text(image_bytes, language, filename) -> OCRResult`.
- **`MockDevelopmentOCRProvider`**: Development-mode fallback using Pillow (`PIL.Image`).
  - Detects image dimensions, format, and aspect ratio.
  - Returns sample cinematic scripts tailored to the requested language (English, Telugu, Tanglish).
  - Explicitly flags `is_production=False` and `provider_name="mock_development_ocr"`.
  - Prompts creator with a visible development disclaimer: *"Development OCR Mode (mock/heuristic) — No production cloud vision API key is configured. Please verify and edit the extracted script text below."*
- **`TesseractOCRProvider`**: Local/production Tesseract provider used when `pytesseract` and system tesseract binary are available.
- **Factory (`get_ocr_provider`)**: Inspects `OCR_PROVIDER` environment variable, falling back gracefully to mock in development.

### Frontend OCR Client (`apps/web/lib/ocr/ocrProvider.ts`)
- Interface `OCRProvider` with `extractText(file, language)`.
- `DefaultOCRProvider` delegates to `POST /api/v1/scripts/extract`.
- `MockClientOCRProvider` for frontend unit testing and offline development.

---

## 3. Security & Validation Rules
- **Maximum File Size**: 10 MB (strictly enforced on both client and backend with HTTP 413 error).
- **Empty File Guard**: Rejects 0-byte uploads with HTTP 400 error.
- **Allowed Extensions**:
  - PDF: `.pdf` (MIME `application/pdf`)
  - DOCX: `.docx` (MIME `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
  - Images: `.jpg`, `.jpeg`, `.png`, `.webp` (MIME `image/*`)
- **Non-trapping Error Handling**: If extraction fails (corrupt file, scanned empty PDF), an error banner offers an instant **"Switch to Paste Text"** escape hatch.

---

## 4. Retention Analyzer Integration
- Existing endpoint `POST /api/v1/analyzer/analyze` updated with optional `script_text` and `source_type`.
- `RetentionAnalyzerAgent` parses raw `script_text` into structured beats, hook, and CTA segments using `script_parser.py` if structured segments are not explicitly provided.
- Runs the 9 retention scoring dimensions (Hook Clarity, Pacing Progression, Information Density, Filler Words, Curiosity Loops, CTA, etc.) without altering scoring weights or thresholds.
- `RetentionWorkspace.tsx` provides clean toggle tabs:
  - `[ Saved Scripts & Presets ]`: Original selector with all Task 2 scrolling fixes preserved.
  - `[ Upload / Paste Script (OCR) ]`: Full `UnifiedScriptInput` component.

---

## 5. Script Studio Persistence
- `POST /api/v1/scripts/save-imported`:
  - Automatically parses normalized text into hook, body beats, and call-to-action.
  - Inserts entry into `scripts` and immutable `script_versions` (Version 1).
  - Returns script ID with an instant direct link: *"Open in Studio"*.
