# CINEHAI AI — Video URL Script Extraction & Generation

## 1. Overview

CINEHAI AI provides a native, end-to-end pipeline that transforms public YouTube and Instagram video links into structured, editable scripts and high-retention AI screenplays.

```
USER PASTES YOUTUBE OR INSTAGRAM URL
                ↓
    SSRF & Platform Validator
                ↓
  Transcript / Audio Extraction
  (Official Captions → Local Whisper STT)
                ↓
  Multilingual Preservation
  (English, Telugu Unicode, Tanglish Latin)
                ↓
   Original Editable Script View
                ↓
    ┌───────────┴───────────┐
    ↓                       ↓
Save / Analyze / Optimize   Generate New Screenplay
(Version 1 Script)          (9 High-Retention Adaptation Goals)
```

---

## 2. Supported Platforms & Constraints

| Platform | Supported URL Formats | Primary Extraction | Fallback Extraction |
| :--- | :--- | :--- | :--- |
| **YouTube** | `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...` | `youtube-transcript-api` (Official Captions) | `yt-dlp` audio download + `faster-whisper` STT |
| **Instagram** | `instagram.com/reel/...`, `instagram.com/p/...`, `instagram.com/tv/...` | `yt-dlp` audio download + `faster-whisper` STT | N/A (login walls return clean 400 error) |
| **TikTok** | *Unsupported in this phase* | Rejected immediately with helpful 400 error | N/A |

### Security & Privacy Protections
1. **SSRF Defense (`video_url_validator.py`)**:
   - Resolves hostnames to IP addresses via DNS.
   - Blocks loopback addresses (`127.0.0.0/8`, `::1`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local, multicast, and reserved ranges.
   - Validates schemes (HTTP/HTTPS only).
2. **Platform & Auth Respect**:
   - Does not bypass login walls, private accounts, DRM, or bot protections.
   - Returns clean error message: *"Unable to access this video from the supplied URL. The video may be private, restricted, unavailable, or unsupported."*
3. **Ephemeral Media Storage**:
   - Media downloads use isolated `tempfile.TemporaryDirectory()`.
   - Audio files are strictly ephemeral and wiped in `finally` blocks immediately after transcription completes. No video/audio files remain on disk.

---

## 3. Multilingual Engine & Language Handling

The engine guarantees fidelity across three script modes without translating spoken dialogue to English:

1. **English**: Extracted as clean spoken dialogue.
2. **Telugu (తెలుగు Unicode)**:
   - Native Unicode is preserved verbatim.
   - When transcribing via Whisper, phonetic noise is repaired via `HybridSpeechRestorationService` and Gemini while retaining natural Telugu grammar and vocabulary.
3. **Tanglish (Telugu written in Latin script)**:
   - Preserves Telugu words transliterated into readable Latin script.
   - Speech timings and pauses are synchronized.

---

## 4. AI Screenplay Adaptation Goals

From extracted dialogue, creators can generate a structured screenplay tailored to their niche and audience using 9 adaptation goals:

| Adaptation Goal | Focus & Hook Strategy |
| :--- | :--- |
| **Rewrite** | Clean, high-impact phrasing with enhanced visual cues and pacing. |
| **Improve Hook** | High-contrast visual tease + shock statement in the first 3 seconds. |
| **Improve Retention** | Pattern interrupts every 4 seconds, micro-rehooks, and momentum loops. |
| **Shorter Version** | Punchy 15-30s reel stripping fluff and prioritizing core takeaway. |
| **Longer Version** | Deep-dive multi-section script with examples and B-roll expansion. |
| **New Angle** | Flips perspective (contrarian viewpoint, behind-the-scenes, critique). |
| **Educational Version** | Problem → Breakdown → 3 Actionable Steps → Summary. |
| **Storytelling Version** | Narrative arc: Relatable Struggle → Turning Point → Climax → Lesson. |
| **Creator-Style Rewrite** | Injects Creator Profile persona, tones, catchphrases, and signature style. |

---

## 5. API Reference

### `POST /api/v1/scripts/extract-from-url`
Extracts spoken text and segment timestamps from YouTube or Instagram URLs.

**Request Payload:**
```json
{
  "url": "https://www.youtube.com/watch?v=EXAMPLE_ID",
  "language": "English",
  "preferred_method": "auto"
}
```

**Response Payload (`VideoURLScriptExtraction`):**
```json
{
  "source_url": "https://www.youtube.com/watch?v=EXAMPLE_ID",
  "platform": "YouTube",
  "video_id": "EXAMPLE_ID",
  "title": "Cinematic Lighting Setup",
  "creator_name": "StudioPro",
  "duration_seconds": 58.0,
  "language": "English",
  "transcript": "Stop lighting your videos from the front! Here is the 3-point setup...",
  "segments": [
    { "id": "seg_0", "start": 0.0, "end": 4.2, "text": "Stop lighting your videos from the front!" }
  ],
  "extraction_method": "official_transcript",
  "transcription_provider": "youtube_transcript_api",
  "confidence": 0.98,
  "source_type": "video_url",
  "warnings": []
}
```

### `POST /api/v1/scripts/generate-from-url`
Transforms extracted video dialogue into a new CINEHAI structured screenplay and saves it as Version 1.

**Request Payload (`GenerateScriptFromURLRequest`):**
```json
{
  "url": "https://www.youtube.com/watch?v=EXAMPLE_ID",
  "extracted_text": "Stop lighting your videos from the front! ...",
  "original_video_title": "Cinematic Lighting Setup",
  "platform": "Instagram Reels",
  "language": "English",
  "duration_seconds": 30,
  "goal": "Improve Hook",
  "instructions": "Make it cinematic and punchy"
}
```

---

## 6. Frontend Components

- **`ScriptWorkspace.tsx`**: Top navigation switcher:
  `[ Write Script ] [ Upload File ] [ Video URL ]`
- **`VideoURLInputPanel.tsx`**:
  - Live platform detection badges (`YouTube`, `Instagram`).
  - Target language selector (`English`, `Telugu`, `Tanglish`).
  - Extraction mode selection (`Auto (Captions First)`, `Transcription Only`).
  - 6-step animated progress stepper (`Resolving URL`, `Extracting Captions`, `Transcribing Audio`, `Preserving Language`, `Structuring Script`, `Complete`).
- **`ExtractedVideoScriptPanel.tsx`**:
  - Metadata header (source link, platform badge, duration, creator handle, extraction method tag).
  - Word and character count counters.
  - Full editable title and spoken dialogue.
  - Tabbed switcher (`Original Extracted`, `AI Screenplay`, `Side-by-Side Comparison`).
  - Action buttons:
    - **Save as Script**: creates immutable Version 1 CINEHAI `Script`.
    - **Analyze Retention**: seamless handoff to `/analyzer`.
    - **Optimize Script**: seamless handoff to `/optimizer`.
    - **Push to Calendar**: seamless handoff to `/calendar`.
