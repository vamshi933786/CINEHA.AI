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
1. **`LocalWhisperTranscriptionProvider` (Default / Free)**:
   - Free on-device neural speech-to-text provider utilizing `faster-whisper` (CTranslate2).
   - Runs locally on host hardware (Apple Silicon CPU/NEON acceleration) without OpenAI API credits or keys.
   - Decodes audio directly via FFmpeg into a 16kHz float32 mono PCM NumPy array, completely bypassing PyAV decoding bugs.
   - Model caching: Singleton pattern loads model once per model size (`base` by default, `tiny` alternative) and reuses across requests.
   - Truthful metadata: populates `is_production_provider = True`, `provider_name = "local_whisper"`, and `word_timings_available = True`.
   - Generates genuine word-level timestamps directly from model output; never fabricates timestamps.
2. **`OpenAIWhisperTranscriptionProvider` (Cloud Optional)**:
   - Production cloud neural speech-to-text provider adapter utilizing the OpenAI Whisper API (`v1/audio/transcriptions`).
   - Extracts 16 kHz speech-optimized audio from video containers via `ffmpeg`.
   - Requests granular word-level and segment-level timestamps via `timestamp_granularities[]=["word", "segment"]`.
   - Normalizes raw Whisper responses into canonical `TranscriptionResult`, `TranscriptSegment`, and `TranscriptWord` models.
   - Truthful metadata: populates `is_production_provider = True`, `provider_name = "openai_whisper"`, and `word_timings_available`.
   - Never fabricates synthetic word timestamps if the provider only returns segment timings.
   - Explicitly rejects unconfigured requests with a 400 error when credentials are missing, preventing deceptive mock substitution.
3. **`MockDevelopmentTranscriptionProvider`**:
   - Deterministic offline development provider reserved strictly for automated unit tests.
   - Generates realistic timed screenplay segments (0:00 to 0:19) with granular word-level start/end timestamps.
   - Strictly sets `is_production_provider = False` and `provider_name = "heuristic_dev_transcription"`.
   - Populates an explicit user-facing notice:
     `"Development Transcription Mode — production speech-to-text provider is not configured. Transcription is simulated based on cinematic screenplay heuristics."`
4. **`ProductionTranscriptionProviderStub`**:
   - Backward-compatible stub preserved for fallback scenarios.

---

## 5.1. Audio Extraction Pipeline (FFmpeg)

Because the Whisper STT engines accept lightweight speech audio rather than multi-gigabyte video containers, the backend extracts and decodes the audio track:

```
[ Uploaded Video Bytes ] ──> [ Temp Video File (.mp4/.mov/.webm) ]
                                            │
                                            ▼
                           [ FFmpeg 16kHz Audio Extraction ]
                           ffmpeg -i input.mp4 -vn -acodec libmp3lame -ar 16000 -ac 1 output.mp3
                                            │
                                            ├─► [ Local Whisper: FFmpeg PCM f32le pipe ] ──► np.ndarray (16kHz float32)
                                            │
                                            └─► [ OpenAI Whisper: 16kHz MP3 bytes ] ─────► HTTP Multipart Request
```

### Extraction Reliability Guarantees:
- **Zero Disk Leakage**: Input and output files are created in isolated temporary locations and strictly removed in `finally` blocks, even under timeouts or unhandled exceptions.
- **Audio Stream Detection**: Video files lacking an audio track are identified via error analysis and rejected with an explicit `HTTP 400: "No audio track was detected in this video."`.
- **FFmpeg Discovery**: Automatically discovers `ffmpeg` in system paths, user Anaconda environments (`/opt/anaconda3/bin/ffmpeg`), or custom paths specified by `FFMPEG_PATH`.

---

## 5.2. Configuration & Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TRANSCRIPTION_PROVIDER` | `local_whisper` | Default engine: `local_whisper` (free on-device), `production` (OpenAI cloud API), or `mock` (unit tests only) |
| `LOCAL_WHISPER_MODEL` | `base` | Model size for Local Whisper (`tiny`, `base`, `small`, `medium`, `large-v3`) |
| `WHISPER_API_KEY` | None | Dedicated OpenAI API key for Whisper transcription (falls back to `OPENAI_API_KEY`) |
| `WHISPER_MODEL` | `whisper-1` | Target OpenAI Whisper model ID |
| `WHISPER_API_URL` | `https://api.openai.com/v1/audio/transcriptions` | Whisper API endpoint URL |
| `FFMPEG_PATH` | None | Optional absolute path to system `ffmpeg` binary |

---

## 5.3. Provider Inspection Endpoint

`GET /api/v1/captions/providers` exposes active configuration and provider capabilities:

```json
{
  "default_provider": "local_whisper",
  "is_production_configured": false,
  "is_local_whisper_configured": true,
  "providers": [
    {
      "id": "local_whisper",
      "name": "Local Whisper",
      "is_production": true,
      "is_configured": true,
      "description": "Free on-device neural speech-to-text with word-level timestamps and Apple Silicon acceleration"
    },
    {
      "id": "production",
      "name": "OpenAI Whisper",
      "is_production": true,
      "is_configured": false,
      "description": "Cloud neural speech-to-text with word-level timestamps and multi-lingual audio extraction"
    },
    {
      "id": "mock",
      "name": "Development Mock",
      "is_production": false,
      "is_configured": true,
      "description": "Deterministic simulated screenplay cues for offline testing without local models or cloud credentials"
    }
  ]
}
```

### Caption Studio UI Provider Status Indicators:
- **Local Whisper** — `Available`
- **OpenAI Whisper** — `Available` (if configured) / `Not configured` (if API key missing)
- **Development Mock** — `Development only`

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

## 8. Language Processing Architecture (Translation & Transliteration)

### 8.1. Architectural Distinction: Translation ≠ Transliteration

A core architectural principle of CINEHA AI is the strict separation between **Translation** and **Transliteration**:

```
                       ┌──────────────────────────────────────────────┐
                       │           SOURCE TRANSCRIPT (e.g. TE)        │
                       └──────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [ TRANSLATION (Meaning) ]                      [ TRANSLITERATION (Script) ]
        Converts semantic meaning into                  Converts native script phonetics
        a completely different language.                into Romanized Latin alphabet.
                      │                                               │
                      ▼                                               ▼
          Telugu: "నమస్కారం"                             Telugu: "నమస్కారం"
                 │                                               │
                 ▼                                               ▼
          English: "Greetings" / "Hello"                 Tanglish: "Namaskaram" (te-Latn)
```

- **Translation**: Converts semantics across distinct languages (English ↔ Telugu, English ↔ Hindi, Telugu ↔ Hindi).
- **Transliteration**: Preserves the spoken language identity and Telugu vocabulary, converting the Telugu native orthography into phonetically readable English/Latin letters (**Tanglish** / `te-Latn`).
- **Tanglish is NOT an English translation**: Labeling Tanglish as translation is strictly prohibited by CINEHA AI's domain contracts.

---

### 8.2. Domain Models

```typescript
interface ProcessedTranscriptSegment {
  id: string;               // Matches parent segment ID
  original_text: string;    // Pre-processing transcript text
  text: string;             // Processed translated or transliterated text
  start_time: number;       // Frame-accurate start timestamp in seconds (immutable)
  end_time: number;         // Frame-accurate end timestamp in seconds (immutable)
  words?: TranscriptWord[]; // Empty array: word timings marked unavailable
  speaker?: string | null;
  confidence?: number | null;
}

interface LanguageProcessingResult {
  source_language: string;
  target_language: string;
  target_language_code: string;
  is_transliteration: boolean;
  script_type: string;
  processing_mode: "translation" | "transliteration" | "none";
  segments: ProcessedTranscriptSegment[];
  full_text: string;
  original_full_text: string;
  provider_name: string;
  is_production_provider: boolean;
  word_timings_available: boolean;
  notice?: string | null;
  metadata?: Record<string, any>;
}
```

---

### 8.3. Provider Architecture

Language processing uses an extensible provider hierarchy rooted in `BaseLanguageProcessor`:

1. **`MockDevelopmentLanguageProcessor`**:
   - Offline, deterministic processor for local development and CI testing.
   - Provides realistic cinema translations across English, Telugu, and Hindi.
   - Implements a syllabic Telugu unicode phonetics engine converting Telugu script (`\u0c00`–`\u0c7f`) into natural Tanglish.
   - Flags output with `is_production_provider = False` and an explicit user-facing notice:
     `"Development Language Processing Mode — production language processor is not configured. Output is simulated for development/testing."`
2. **`ProductionLanguageProcessorAdapter`**:
   - Production cloud adapter utilizing OpenAI GPT-4o-mini (`/v1/chat/completions`).
   - Translates dialogue and transliterates script while strictly preserving segment IDs and boundaries.
   - If credentials (`LANGUAGE_PROCESSOR_API_KEY` or `OPENAI_API_KEY`) are missing, explicitly raises HTTP 400 without deceptive fallback.

---

### 8.4. Segment & Timing Preservation Guarantees

1. **Exact Segment Bounds**: Start (`start_time`) and end (`end_time`) timestamps of every segment are preserved verbatim from the input transcription.
2. **No Word Fabrication**: Because machine translation and phonetic transliteration alter token lengths and word order, original word timestamps are **never** artificially mapped onto translated words. `words` is set to an empty array and `word_timings_available = False`.
3. **Non-Destructive Originals**: The original transcript remains permanently intact in application memory. The creator can switch between **Side-by-Side**, **Processed Only**, and **Original Only** views, apply the processed version to downstream caption tools, and revert to the original at any point.

---

---

## 9. Caption Cue Generation & Synchronized Plain Caption Preview

### 9.1. Caption Cue Domain Contract (`CaptionCue`)

`CaptionCue` bridges the gap between raw speech transcripts and visual display rendering:

```typescript
interface CaptionCue {
  id: string;                      // Stable identifier: e.g. "cue_0"
  text: string;                    // Normalized caption phrase
  start_time: number;              // In seconds (ge=0.0)
  end_time: number;                // In seconds (end_time > start_time)
  duration: number;                // Duration in seconds (round(end - start, 3))
  language: string;                // Language name (English, Telugu, Hindi, Tanglish)
  language_code: string;           // Language tag (en, te, hi, te-Latn)
  lines: string[];                 // Screen layout lines (max_lines = 1..3)
  source_segment_ids: string[];    // Parent segment lineage
  words?: CaptionCueWord[];        // Sub-word timestamps when valid timing exists
  manually_edited: boolean;        // True if text or timing was modified by creator
  position?: Record<string, any>;  // Screen coordinate placement
  style?: Record<string, any>;     // Visual styling attributes
  metadata?: Record<string, any>;  // Word count, character count, generator stats
}
```

### 9.2. Deterministic Cue Generation Algorithm

Caption cues are derived strictly through deterministic linguistic and cadence heuristics without LLM latency or non-determinism:

1. **Word-Timing Path**:
   - Activated when valid word timestamps (`w.end_time > w.start_time`) exist on segments.
   - Evaluates natural word groupings based on:
     - `preferred_words_per_cue` (default 6 words)
     - `gap_threshold` (pauses ≥ 0.5s trigger automatic cue boundaries)
     - Punctuation cues (periods, commas, semicolons, question marks, and Indic danda `।` `॥`)
     - Duration caps (`minimum_cue_duration = 0.8s`, `maximum_cue_duration = 4.0s`)
     - Total character constraints (`max_characters_per_line * max_lines`)
   - Emits micro-cues synchronized to exact spoken word boundaries.

2. **Segment-Only Path**:
   - Activated when word timestamps are unavailable (e.g. translated/transliterated text or raw segments).
   - Generates cues directly from frame-accurate segment boundaries.
   - **Zero Fabrication**: Word timestamps are strictly omitted (`words = []`).

3. **Line Breaking Rules**:
   - Configurable limits: `max_lines` (default 2) and `max_characters_per_line` (default 36).
   - When 2 lines are configured, employs balanced line-length scoring to prevent single orphan words on the trailing line.
   - Preserves multi-lingual Unicode: English, Telugu script (`\u0c00`–`\u0c7f`), Hindi Devanagari (`\u0900`–`\u097f`), and Tanglish without character corruption or split grapheme clusters.

4. **Sanitization Guarantees**:
   - Monotonic start time ordering.
   - Clamping overlapping cues: `cue[i].end_time = cue[i+1].start_time`.
   - Positive non-zero duration: `duration >= 0.05s`.

### 9.3. Active Transcript Source & Non-Destructive Workflow

The generator operates on whichever transcript is currently active in the workspace:
- **Original Source**: English, Telugu, or Hindi verbatim transcript.
- **Translated Source**: Translated text applied to active captions.
- **Transliterated Source**: Phonetic Romanized script (Tanglish `te-Latn`).

The UI explicitly displays the active source nature (`Caption Source: Original / Translated / Transliterated`).

### 9.4. Synchronized Plain Caption Video Preview

- **Accurate Video Synchronization**: Connects to the HTML5 `<video>` element's `currentTime` via `onTimeUpdate` and `onSeeked` listeners.
- **Active Cue Detection**: At playback timestamp $T$, queries:
  $$\text{cue.start\_time} \le T < \text{cue.end\_time}$$
  and overlays the active cue. When $T$ lies outside all cue intervals, no caption is displayed.
- **Plain Presentation Controls**:
  - Text alignment: Left, Center, Right
  - Vertical position: Top, Center, Bottom
  - Font size: Small, Medium, Large
  - Background: None (transparent with text shadow) vs Subtle Box (`bg-black/85`)
- **9:16 Vertical Safe Area Guide**: An optional visual overlay marking vertical video top headers, bottom description/music tags, and right social action rails to assist creators in positioning captions.

### 9.5. Manual Editing & Regeneration Safety

- **Text & Timing Editing**: Creators can edit caption text (recomputing visual lines without shifting timestamps) or adjust numeric start/end timestamps with instant validation ($0 \le \text{start} < \text{end}$).
- **Edited Tag**: Manually edited cues are flagged with `manually_edited = true`.
- **Regeneration Guard**: If manual edits exist, clicking "Regenerate Captions" triggers an explicit confirmation dialog before overwriting edits.
- **Seek on Click**: Selecting any cue card in the editor immediately seeks the video player to that cue's start timestamp for verification.

---

## 10. Motion-Graphic Caption Engine (Browser Preview)

> [!NOTE]
> **Browser Preview Only**: The motion-graphic caption engine implemented in Task 9 operates entirely within the client-side DOM layer over the HTML5 `<video>` preview. It provides real-time interactive visualization of kinetic typography. It does **NOT** permanently render or burn captions into video files or export video containers.

### 10.1. Architecture & Presentation Decoupling

The Motion Caption Engine extends Caption Studio without modifying underlying transcript data or timing bounds:

```
[ Active Transcript ] ───────► [ Deterministic Cue Generator ] ───────► [ CaptionCue[] ]
                                                                               │
                                               ┌───────────────────────────────┴───────────────────────────────┐
                                               ▼                                                               ▼
                                     [ PLAIN CAPTION MODE ]                                          [ MOTION CAPTION MODE ]
                                     • Static display typography                                     • Synchronized word highlighting
                                     • Minimalistic box / text shadow                                • Preset animations (Pop, Bounce, Fade)
                                     • Standard screen alignment                                     • Karaoke progressive illumination
                                                                                                     • Reduced-motion accessibility
```

### 10.2. Motion Preset Library

| Preset | Visual Purpose | Entrance | Word Effect | Active Word Style | Word Sync Req.? |
|---|---|---|---|---|:---:|
| **Clean Pop** | Modern, crisp short-form pop. Subtle scaling on entrance, clean dark pill background. | Pop | Pop | Cyan highlight (`#22D3EE`) with soft glow | Optional |
| **Karaoke** | Progressive word illumination. Spoken words illuminate brightly with gold accent; unspoken words dimmed. | Fade | Highlight | Gold text (`#FACC15`) with full opacity | **Yes** (Fallback to segment) |
| **Bold Bounce** | High-energy kinetic bounce with punchy spring entrance. Active words scale up with extra weight. | Pop | Emphasis | Purple accent (`#A855F7`) with scale boost | Optional |
| **Minimal Fade** | Subtle, cinematic documentary presentation. Soft opacity transitions without positional movement. | Fade | None | Pure white text with standard weight | Optional |
| **Punchy** | High contrast impact. Heavy black typography with vibrant neon yellow highlight box on active words. | Slide Up | Pop | Amber box (`#FBBF24`) with black bold text | Optional |

### 10.3. Word-Timing Behavior vs. Segment Fallback

1. **Word-by-Word Synchronization**:
   - When genuine word timestamps are present on cues (`w.end_time > w.start_time`), the engine computes:
     $$\text{word.start\_time} \le \text{currentTime} < \text{word.end\_time}$$
   - The active word receives immediate GPU-accelerated CSS scaling and accent coloring.
   - The UI displays an emerald indicator: `"Word-synced motion available"`.
2. **Segment-Level Fallback**:
   - When word timestamps are absent (such as machine-translated or transliterated Tanglish transcripts), the engine **strictly avoids synthesizing fake word timestamps**.
   - The entire caption phrase animates gracefully using segment-level motion.
   - For Karaoke mode, the UI explains: `"Karaoke word synchronization is unavailable for translated/transliterated text. Segment-level fallback active."`
   - The UI displays an amber indicator: `"Segment timing only"`.

### 10.4. Entrance and Exit Animation Timing

- Entrance transitions (`pop`, `fade`, `slide_up`) trigger within the first $0.2\text{s}$ of cue playback:
  $$\tau = \text{currentTime} - \text{cue.start\_time} < 0.2\text{s}$$
- Exit transitions (`fade`, `slide_down`) trigger in the trailing $0.2\text{s}$ before cue completion:
  $$\text{rem} = \text{cue.end\_time} - \text{currentTime} < 0.2\text{s}$$
- Animations are anchored to cue identity and video time rather than component render cycles, preventing visual resets during React re-renders.

### 10.5. Accessibility & Reduced Motion

- Automatically detects the user's `prefers-reduced-motion` system setting.
- When reduced motion is active:
  - All positional movement and transforms (`translateY`, bounce) are disabled.
  - Scale transforms are locked to `scale(1.0)`.
  - Active words retain high-contrast color highlighting and font weight changes so captions remain fully readable without disorientation or seizure risk.

### 10.6. Performance & Synchronization Strategy

- **Zero Custom Interval Loops**: Synchronization is driven purely by browser HTML5 `<video>` events (`onTimeUpdate`, `onSeeked`, `onPlay`).
- **GPU-Accelerated Compositing**: All animations utilize CSS `transform`, `opacity`, and `color` properties, offloading rendering to the hardware compositor.
- **Stable Keys**: Word elements utilize stable compound keys (`cue.id + "_w_" + index`), minimizing DOM mutations.

---

## 11. Direct-on-Video Caption Generation & FFmpeg Export Engine

### 11.1. Supported Caption Languages
Caption Studio offers exactly three selectable language workflows:
1. **English (`en`)**: Standard English speech-to-text recognition with micro word-level timestamps and Latin font rendering.
2. **Telugu (`te` / `తెలుగు`)**: Native Telugu script speech transcription or translation rendered with real Unicode Telugu fonts (`Telugu Sangam MN`, `Kohinoor Telugu`, `Noto Sans Telugu`, `Lohit Telugu`, `Pothana2000`).
3. **Tanglish (`te-Latn`)**: Conversational Telugu written phonetically in the Latin alphabet (Romanized transliteration), providing effortless readability for digital audiences without needing Telugu script literacy.
*Note: Hindi is not selectable in the Caption Studio interface.*

### 11.2. Complete User Workflow
```
Upload Video (MP4/MOV/WebM ≤ 100 MB)
      ↓
Choose Caption Language (English, Telugu, Tanglish)
      ↓
Generate Captions (via Whisper STT or Heuristic Dev Mode)
      ↓
Synchronized Overlaid Captions appear directly over video preview
      ↓
Customize Styling (Presets: Clean Pop, Karaoke, Bold Bounce, Minimal Fade; Typography, Colors, Position)
      ↓
Render Captioned Video (FFmpeg Advanced SubStation Alpha burned-in rendering)
      ↓
Download Final MP4 with burned-in subtitles
```

### 11.3. FFmpeg Burned-In Rendering Architecture
Permanent caption burn-in uses the FFmpeg `subtitles` / `ass` filter (`libass`):
- **ASS Subtitle Script Generation**: Generates standard Advanced SubStation Alpha (`.ass`) subtitle files with millisecond timing precision (`h:mm:ss.cc`).
- **Styling Mapping**:
  - `clean_pop`: Bold sans-serif font, cyan accent color (`#22D3EE`), dark semi-transparent pill/box background (`&H33000000`), subtle entrance scaling.
  - `karaoke`: Word illumination tags (`{\k<duration>}` / `{\K<duration>}`), golden highlight (`#FACC15`), muted base text.
  - `bold_bounce`: Extra bold typography with drop shadow and outline.
  - `minimal_fade`: Clean, borderless minimalist typography with soft drop shadow.
- **Color Translation**: Converts CSS hex/RGBA colors (`#RRGGBB` / `rgba(...)`) to ASS format (`&HAABBGGRR&`).
- **Probe-Aware Coordinate Scaling**: Probes source video width, height, and display matrix via `ffprobe` to set `PlayResX` and `PlayResY` proportionally, ensuring identical font sizes across vertical (9:16), horizontal (16:9), and square videos.
- **Audio & Video Re-encoding**: Uses `libx264` (`-pix_fmt yuv420p`, `-preset medium`, `-crf 22`) and `aac` audio passthrough/copy (`-c:a copy` or `aac -b:a 192k`), producing universally compatible MP4 outputs.

### 11.4. Real Unicode Font Resolution Strategy
To ensure Telugu script renders with zero missing glyphs or "tofu" boxes across all platforms:
- **macOS**: Looks for `Telugu Sangam MN.ttc` or `KohinoorTelugu.ttc` in `/System/Library/Fonts/Supplemental/` or `/System/Library/Fonts/`.
- **Linux / Docker**: Looks for `NotoSansTelugu-Regular.ttf`, `NotoSansTelugu-Bold.ttf`, `Lohit-Telugu.ttf`, or `Pothana2000.ttf` in `/usr/share/fonts/opentype/noto/`, `/usr/share/fonts/truetype/noto/`, or `/usr/share/fonts/truetype/lohit-telugu/`.
- **Windows**: Resolves `Gautami.ttf` or `Vani.ttf` in `C:\Windows\Fonts\`.
- **Fallback**: System fontconfig (`fc-match telugu`) and ASS `Fontname` fallback chain.
- Creators can configure custom fonts via the `TELUGU_FONT_PATH` environment variable.

### 11.5. API Endpoints
- `POST /api/v1/captions/generate`: Unified pipeline endpoint accepting video upload + target language (`English`, `Telugu`, `Tanglish`), executing transcription, language processing, and cue generation in one step.
- `POST /api/v1/captions/render`: Renders an MP4 with burned-in captions given source video + cue array + visual options.
- `GET /api/v1/captions/render/{render_id}/download`: Streams the completed MP4 artifact with `Content-Disposition: attachment; filename="..."`.

### 11.6. Render Cache & Artifact Management
Rendered MP4 artifacts are stored in a dedicated scratch cache directory (`RENDER_CACHE_DIR`):
- Managed in-memory registry (`RENDER_REGISTRY`) maps `render_id` UUIDs to output file paths and metadata.
- Cache size is bounded to 50 active renders (`MAX_CACHE_ENTRIES = 50`) to avoid disk bloat.
- Stale rendered files are automatically pruned when the cache exceeds capacity or age limits.

### 11.7. Speech Transcription & Provider Architecture
- **Production Mode (Default)**: CINEHA AI requires live neural speech recognition (`OpenAIWhisperTranscriptionProvider`) powered by `OPENAI_API_KEY` or `WHISPER_API_KEY` in `apps/api/.env`. Captions are extracted directly from the actual audio voice track of the uploaded video.
- **Strict Prohibition of Silent Mock Captions**: The system NEVER silently falls back to canned or mock captions in the user flow. If API credentials are not configured, the API returns HTTP 400 with a clear advisory: `"Production speech recognition is not configured. Production transcription is not configured. Please set OPENAI_API_KEY or WHISPER_API_KEY in apps/api/.env to enable speech-to-text."` and the UI alerts the user.
- **Mock Provider Reserved Strictly for Automated Unit Tests**: The `MockDevelopmentTranscriptionProvider` is only invoked when `provider="mock"` is explicitly passed in internal test fixtures.
- **Audio Track Validation**: Before invoking speech-to-text, FFmpeg probes the uploaded container for an active audio stream. If the video is silent or contains no audio track, processing halts immediately with the explicit error: `"No audio track was detected in this video."`
- **Genuine Word Timings**: When Whisper returns word-level timestamps (`words` array in verbose JSON), they are preserved directly. If word timestamps are unavailable, word timing fabrication is strictly prohibited—segments fall back cleanly to segment bounds (`word_timings_available = False`).
- **Telugu Script Recognition & Tanglish Transliteration**: Spoken Telugu is transcribed into authentic Telugu Unicode script (`te`). Tanglish is strictly treated as an output format generated via phonetic transliteration of authentic Telugu text into Latin characters.
- **Session Isolation & State Reset**: Audio extraction executes within isolated temporary directories (`/tmp/cinehai_audio_<uuid>`) that are purged immediately after processing. When a new video is uploaded, all previous captions, cues, and renders are reset to prevent cross-video state contamination.

---

## 12. Security & Privacy

1. **No Filesystem Path Leakage**: Internal server paths (e.g., `/tmp/...` or OS paths) are never returned in API responses or logs.
2. **In-Memory Streaming & Secure Temp Files**: Video uploads are isolated with unique UUIDs and safe temporary files.
3. **Upload Size Guard**: The 100 MB limit protects server memory and prevents denial-of-service attacks from oversized video uploads.
4. **Credential Isolation**: Cloud API keys remain strictly in backend environment variables and are never exposed to the frontend client.

---

## 13. Completed Milestones

- **Milestone 1**: Video Validation & Ingestion (100 MB limit, magic-byte checks).
- **Milestone 2**: Speech Recognition & Provider Abstraction (Whisper + Dev simulation).
- **Milestone 3**: Language Processing (Translation to Telugu, Transliteration to Tanglish).
- **Milestone 4**: Caption Cue Generation (Deterministic line breaking, gap handling).
- **Milestone 5**: Direct-on-Video Synchronized Plain & Motion Preview (Clean Pop, Karaoke, Bold Bounce, Minimal Fade).
- **Milestone 6**: Direct Multilingual Video Rendering Engine (FFmpeg libass burned-in captions, Telugu Unicode font support, MP4 export & download).
- **Milestone 7**: Real Speech Transcription Accuracy & Audio Track Validation (Audio stream detection, strict no-mock production policy, Whisper verbose word timings, isolated temp sessions, and upload state reset).




