# CINEHA AI — Caption Studio Foundation

## 1. Overview & Objective

The **Caption Studio** feature in CINEHA AI provides high-precision speech-to-text ingestion and timed captioning foundations for short-form video creators. It bridges the gap between raw video footage and animated, high-retention on-screen captions.

The immediate foundation implemented in Task 5 establishes:
1. Video file ingestion with strict container validation and a 100 MB limit.
2. An extensible speech-to-text provider abstraction.
3. Deterministic development transcription with micro word-level timestamps.
4. Native support for regional language taxonomies including English, Telugu, Hindi, and Tanglish.
5. An interactive transcript editor that allows creators to fix wording while preserving locked timing bounds.
6. A forward-compatible domain contract ready for downstream caption styling, kinetic motion graphics, and video rendering.

---

## 2. Architectural Pipeline

The system is organized into modular phases:

```
[ VIDEO FILE (MP4/MOV/WebM) ]
            │
            ▼
[ VIDEO INGESTION & VALIDATION ] ──> Enforces 100 MB max size, extension & magic-byte container checks
            │
            ▼
[ TRANSCRIPTION SERVICE ] ─────────> Selects provider via BaseTranscriptionProvider interface
            │
            ▼
[ TIMED SPEECH SEGMENTS ] ─────────> Normalizes sentence-level and word-level timestamps (start_time, end_time)
            │
            ▼
[ EDITABLE TRANSCRIPT ] ───────────> Creator corrects wording; timestamps remain immutable
            │
            ▼ (Future Phases)
[ CAPTION CUES & STYLING ] ────────> Applies typography, positioning, colors, highlighting
            │
            ▼ (Future Phases)
[ KINETIC MOTION GRAPHICS ] ───────> Pop, fade, bouncy word-by-word animation
            │
            ▼ (Future Phases)
[ RENDER & EXPORT ] ───────────────> Burned-in video compositor or standalone SRT/VTT export
```

---

## 3. Video Ingestion & Validation

Video files are ingested via `POST /api/v1/captions/transcribe` (multipart/form-data) and client-side dropzone validation.

### Validation Specifications:
- **Maximum File Size**: Strict **100 MB** (`104,857,600 bytes`). Files exceeding this size are rejected with HTTP 413.
- **Allowed Formats**: `.mp4`, `.mov`, `.webm`.
- **MIME Types**: `video/mp4`, `video/quicktime`, `video/webm`, `video/x-matroska`.
- **Header Magic-Byte Inspection**:
  - **MP4 / ISO BMFF**: Checks for `ftyp` box at offset 4..8 with valid brands (`isom`, `mp41`, `mp42`, `qt`).
  - **MOV (QuickTime)**: Checks for QuickTime atom signatures (`moov`, `mdat`, `wide`, `ftypqt`).
  - **WebM**: Verifies EBML ID header bytes `\x1a\x45\xdf\xa3`.
  - Non-video files disguised with a video extension (e.g., text or image renamed to `.mp4`) are rejected with HTTP 400.
- **Empty File Protection**: 0-byte uploads are rejected with HTTP 400.

---

## 4. Domain Contracts

### `CaptionSource`
```typescript
interface CaptionSource {
  source_type: "video_upload" | "audio_upload" | "youtube_url" | "custom_storage";
  filename?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  duration_seconds?: number | null;
  storage_path?: string | null;
  metadata?: Record<string, any>;
}
```

### `TranscriptWord`
```typescript
interface TranscriptWord {
  text: string;
  start_time: number; // in seconds, e.g. 0.35
  end_time: number;   // in seconds, e.g. 0.65
  confidence?: number | null;
}
```

### `TranscriptSegment`
```typescript
interface TranscriptSegment {
  id: string;               // e.g. "seg_0", "seg_1"
  text: string;             // Segment transcript phrase
  start_time: number;       // e.g. 0.00
  end_time: number;         // e.g. 3.40
  words?: TranscriptWord[]; // Word-level timestamps
  speaker?: string | null;
  confidence?: number | null;
}
```

### `TranscriptionResult`
```typescript
interface TranscriptionResult {
  language: string;
  language_code?: string | null;
  is_transliteration?: boolean;
  script_type?: string;
  segments: TranscriptSegment[];
  full_text: string;
  duration_seconds?: number | null;
  provider_name: string;
  is_production_provider: boolean;
  confidence?: number | null;
  metadata?: Record<string, any>;
}
```

### `CaptionCue` (Future-Ready Contract)
Downstream caption renderers consume `CaptionCue` objects derived from `TranscriptSegment`:
```typescript
interface CaptionCue {
  id: string;
  segment_id: string;
  start_time: number;
  end_time: number;
  text: string;
  words?: TranscriptWord[];
  position?: Record<string, any> | null;
  style?: Record<string, any> | null;
}
```

---

## 5. Provider Abstraction

The transcription architecture uses an abstract provider interface `BaseTranscriptionProvider`:

```python
class BaseTranscriptionProvider(ABC):
    @abstractmethod
    async def transcribe(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
    ) -> TranscriptionResult:
        pass
```

### Implemented Providers:
1. **`MockDevelopmentTranscriptionProvider`**:
   - Deterministic offline development provider.
   - Generates realistic timed screenplay segments (0:00 to 0:19) with granular word-level start/end timestamps.
   - Strictly sets `is_production_provider = False` and `provider_name = "heuristic_dev_transcription"`.
   - Populates an explicit user-facing notice:
     `"Development Transcription Mode — production speech-to-text provider is not configured. Transcription is simulated based on cinematic screenplay heuristics."`
2. **`ProductionTranscriptionProviderStub`**:
   - Adapter boundary for production cloud speech engines (e.g. OpenAI Whisper API, Google Cloud Speech-to-Text v2, Deepgram).
   - Inspects environment credentials. If credentials are missing, falls back to `MockDevelopmentTranscriptionProvider` without crashing or falsely claiming production status.

---

## 6. Language Support & The Tanglish Distinction

CINEHA AI supports multi-lingual short-form creators across South Asian and global content ecosystems:

| Language | Code | Script Type | Transliteration? | Description |
|---|---|---|---|---|
| **English** | `en` | Latin | No | Standard English speech-to-text |
| **Telugu** | `te` | Telugu | No | Native Telugu script recognition (తెలుగు) |
| **Hindi** | `hi` | Devanagari | No | Native Devanagari Hindi recognition (हिन्दी) |
| **Tanglish** | `te-Latn` | Latin | **Yes** | Telugu spoken audio transcribed into Romanized Latin characters |

### The Tanglish Architectural Distinction:
Tanglish is widely spoken by Indian digital creators but is phonetically Romanized Telugu. It is **not** a separate native writing script; rather, it is spoken Telugu mapped into English/Latin alphabet typography (`te-Latn`).
The system explicitly distinguishes Tanglish with `is_transliteration = True` and `script_type = "Latin"`. This prevents confusion with native Telugu script (`te` in Telugu script), allowing future AI modules to perform script transliteration and phonetic normalization accurately.

---

## 7. Interactive Transcript Editor

The frontend provides an interactive editor (`TranscriptEditor`):
- **Segment View**: Lists timed segments with read-only timestamp chips (e.g., `00:00.000 → 00:03.400`) and speaker badges.
- **Word Timings Drilldown**: Clicking on the word count tag reveals individual micro-cues with per-word start times (e.g., `"60fps" [0.80s]`).
- **Timing Immutability**: When the creator edits segment text, the start and end timestamps remain locked. This guarantees that downstream video sync remains frame-accurate.
- **Full Transcript View**: Provides a continuous text block for holistic proofreading.

---

## 8. Security & Privacy

1. **No Filesystem Path Leakage**: Internal server paths (e.g., `/tmp/...` or OS paths) are never returned in API responses or logs.
2. **In-Memory Streaming**: Uploaded video files are processed as byte streams and discarded immediately after transcription; no unmanaged temporary files are persisted to disk.
3. **Upload Size Guard**: The 100 MB limit protects server memory and prevents denial-of-service attacks from oversized video uploads.
4. **Credential Isolation**: Cloud API keys remain strictly in backend environment variables and are never exposed to the frontend client.

---

## 9. Future Pipeline Milestones

The foundation established in Task 5 directly unblocks subsequent phases:
- **Phase 9.1**: Caption Styling & Font Selection (Subtitles preset, colors, stroke, drop shadow).
- **Phase 9.2**: Motion-Graphic Word Highlighting (Kinetic pop-in, karaoke-style active word highlighting).
- **Phase 9.3**: Multi-lingual Translation & Tanglish Converter.
- **Phase 9.4**: Video Compositor & Export Engine (Burned-in MP4 video rendering, SRT, and VTT download).
