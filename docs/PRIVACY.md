# CINEHA AI — Privacy Policy & Data Residency Architecture

This document formalizes CINEHA AI's data handling policies, residency guarantees, and provider routing principles.

---

## 1. Core Privacy Commitments

| Principle | Guarantee |
| :--- | :--- |
| **No Permanent Raw Video Storage** | Uploaded video files are processed strictly in temporary disk sessions and permanently removed immediately after analysis or rendering. |
| **Local Speech Option** | Local Whisper runs 100% on-device/local machine. No speech audio is transmitted externally when Local Whisper is selected. |
| **Minimal External LLM Exposure** | Only the specific textual data necessary for screenplay optimization or retention critique is transmitted to cloud AI providers. Raw media containers are never forwarded to third-party text LLMs. |
| **No Covert Tracking** | Zero client-side analytics trackers, pixel beacons, or third-party advertising cookies are included in the application. |

---

## 2. Module-Specific Privacy Architecture

### A. Video Analysis Module
- **Uploaded Video Handling:** Video files are written to an isolated temporary directory (`/tmp/cinehai_analysis_{uuid}/`).
- **Processing:** Metadata is extracted via local FFprobe; audio is demuxed into an isolated local MP3 stream.
- **Immediate Purge:** The temporary directory and raw video file are permanently deleted in a `finally:` block via `shutil.rmtree()` upon audit completion.
- **Retained State:** Only structured metrics, spoken word timestamps, and textual recommendations are persisted in the SQLite/PostgreSQL database. The raw video container is discarded.

### B. Caption Studio Module
- **Uploaded Source Video:** Uploaded MP4/MOV/WebM assets are used solely for audio extraction and burning in caption subtitles via FFmpeg.
- **Rendered Output Videos:** Rendered captioned MP4 files are stored in an isolated cache directory (`/tmp/cinehai_renders/` or `RENDER_CACHE_DIR`).
- **Cache Eviction:** Rendered MP4 files older than 2 hours (`CACHE_MAX_AGE_SECONDS = 7200`) are automatically pruned from disk and unregistered from memory upon subsequent rendering requests.

### C. Speech-to-Text Providers & Data Residency
1. **Local Whisper (`local_whisper`, Default):**
   - Model runs locally in Python memory (`faster-whisper` or PyTorch Whisper).
   - Audio stays 100% on the creator's host machine.
   - Recommended for sensitive, embargoed, or private pre-release video productions.
2. **Cloud OpenAI Whisper (`production`):**
   - Transmits audio stream to OpenAI Audio Transcription API (`https://api.openai.com/v1/audio/transcriptions`).
   - Active only when `TRANSCRIPTION_PROVIDER="production"` is explicitly configured and an API key is provided.

### D. Multimodal Speech Restoration (Telugu & Tanglish)
- When Telugu speech restoration is active:
  - Local Whisper transcribes noisy acoustic segments on-device.
  - Only the extracted phonetic segment text is sent to Google Gemini (`gemini-3.5-flash-lite`) via REST API.
  - Video and audio streams are **never sent to Gemini**.

### E. Creator Profile & Persona Engine
- Creator persona attributes (niche, target audience, brand pillars, tone preferences) are stored in the local database.
- When generating hooks or optimizing screenplays, only the relevant persona context is injected into LLM prompts. Sensitive account credentials or personal email addresses are never requested or shared.

---

## 3. Browser Storage Audit

- **localStorage:**
  - Key: `cinehai_settings`.
  - Contents: UI preferences (theme: dark/light, reduced motion, UI density), default video upload limits, preferred caption template ID.
  - Contains **zero personal identifiers, API keys, or session tokens**.
- **sessionStorage:**
  - Keys: `cineha_script_text_handoff`, `cineha_optimizer_handoff`.
  - Contents: Transcripts or screenplay IDs being handed off across routes.
  - Lifetime: Cleared immediately once the target page mounts and parses the payload.

---

## 4. Privacy Mismatch Audit

An audit between documented behavior and codebase implementation confirms **zero mismatches**:
- Verified: Raw videos are purged in `finally:` blocks in `analyzer.py` and `caption_renderer.py`.
- Verified: Local Whisper performs offline transcription without outbound network requests.
- Verified: Gemini is invoked only with text prompts, never with binary video streams.
