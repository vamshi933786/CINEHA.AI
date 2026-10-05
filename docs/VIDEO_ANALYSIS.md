# CINEHA AI — Video Retention Analyzer

The **Video Retention Analyzer** is a multimodal short-form diagnostic workspace within CINEHA AI. It allows creators to upload short-form videos (MP4, MOV, WebM up to 100MB) and performs an objective retention and structural audit across 10 psychological short-form criteria.

---

## 1. Core Architecture

The analysis pipeline operates through a decoupled service workflow:

```
Uploaded Video (MP4 / MOV / WebM <= 100MB)
    │
    ▼
1. Validation Layer (VideoValidator)
    ├── Magic-byte container header verification (ftyp / EBML)
    ├── Non-empty (>= 1 byte) and size bounds (<= 100MB)
    └── Extension check (.mp4, .mov, .webm)
    │
    ▼
2. Stream & Container Extraction (FFmpeg / VideoMetadataExtractor)
    ├── Dimensions (width × height), FPS, container format
    ├── Duration in seconds
    └── Audio stream detection (has_audio)
    │
    ▼
3. Speech Transcription (CaptionService / Local Whisper)
    ├── Speech-to-text via on-device Local Whisper
    ├── Two-Stage Hybrid Telugu Restoration (Gemini 3.5 Flash Lite) if Telugu / Tanglish
    ├── Timed speech segments with genuine micro-timestamps
    └── Graceful degradation to metadata-only analysis if video is silent or music-only
    │
    ▼
4. Signal Extraction (VideoMetricsCalculator)
    ├── Speech velocity (words per second)
    ├── Silence gaps (>1.0s) & opening delay before speech
    ├── Conversational filler words & repeated consecutive tokens
    ├── Opening 0-3s hook speech window
    └── Closing 20% CTA keyword detection
    │
    ▼
5. 10-Dimensional Structural Scoring (0–100)
    ├── Weighted retention formula
    ├── Empirical observed evidence for each dimension
    └── Concrete improvement recommendations
    │
    ▼
6. Qualitative Enrichment (GeminiVideoSemanticAnalyzer)
    ├── Semantic critique grounded in supplied transcript
    ├── Zero timestamp hallucination policy
    └── Graceful fallback to deterministic local heuristics on network error or timeout
    │
    ▼
7. Database Persistence & Resource Cleanup
    ├── Persists metadata, scores, segments, and findings to `video_analyses` table
    └── Guaranteed immediate purge of temporary media files
```

---

## 2. The 10 Retention Criteria (Scored 0–100)

All scores are strictly bounded between 0 and 100 and mapped to transparent creator-facing ratings (*Excellent*, *Strong*, *Moderate*, *Needs Work*).

1. **Hook Strength (`hook_strength`)**  
   Audits the opening 0–3 seconds of the video. Penalizes delayed speech onset (dead air in first second), rewards immediate vocal delivery (<0.4s) and proven curiosity/contrarian hooks.
2. **Opening Clarity (`opening_clarity`)**  
   Evaluates how rapidly and unambiguously the premise or stake is communicated in the opening beat without warm-up fluff.
3. **Retention Structure (`retention_structure`)**  
   Measures pacing modulation and beat density across the video (optimal short-form density: 1 beat every 2.5–5 seconds).
4. **Pacing (`pacing`)**  
   Measures words per second (short-form benchmark: 2.2–3.2 words/sec) and identifies silence pauses exceeding 1.0s.
5. **Information Density (`information_density`)**  
   Ratio of substantive value points and tips relative to video duration.
6. **Filler / Repetition (`filler_repetition`)**  
   Identifies conversational filler words (`"so basically"`, `"you know"`, `"actually"`, `"like"`, `"uh"`, `"um"`) and repetitive consecutive phrasing.
7. **Story / Narrative Flow (`story_flow`)**  
   Evaluates progression through Setup -> Conflict -> Value -> Payoff -> CTA.
8. **Curiosity / Open Loops (`curiosity_open_loops`)**  
   Detects curiosity anchors and unresolved information gaps keeping viewers through to the end.
9. **CTA Strength (`cta_strength`)**  
   Detects closing call-to-action keywords (`"save"`, `"follow"`, `"comment"`, `"share"`, `"link"`, `"dm"`) in the final 20% of the video.
10. **Caption / Accessibility Readiness (`accessibility_readiness`)**  
    Evaluates speech clarity, audio balance, and segment granularity for 1-click animated subtitle generation in Caption Studio.

### Anti-Hallucination Disclosures
- Scores evaluate **content structure and pacing**; they do **not** claim to predict algorithm virality, views, or platform impressions.
- Creator-facing heuristic terminology is used exclusively: *"Retention potential"*, *"Structural strength"*.
- Zero fabrication of timestamps: all segment timestamps match the underlying acoustic model.

---

## 3. Provider Behavior & Fallbacks

- **Local Whisper Transcription**: Free, on-device neural transcription without OpenAI API credit requirements. Supports English, Telugu, Tanglish, and Hindi.
- **Two-Stage Hybrid Telugu Restoration**: Restores phonetic Whisper tokens for colloquial Telugu and Tanglish using Gemini 3.5 Flash Lite while preserving 100% of acoustic segment timestamps.
- **Graceful Degradation on Audio Absence**:
  If an uploaded video contains no audio track or if audio extraction fails, the analysis does not return HTTP 500. Instead, `transcript.available` is set to `false`, video container metadata is extracted, structural metrics are evaluated with metadata heuristics, and limitations are reported clearly.
- **Gemini Semantic Analysis Fallback**:
  If Gemini is offline, rate-limited, or unavailable, the system transparently falls back to deterministic local heuristic findings and recommendations.

---

## 4. API Endpoints

### `POST /api/v1/video-analysis/analyze`
Multipart form upload analyzing a video asset.

**Parameters:**
- `file`: Multipart video binary (`.mp4`, `.mov`, `.webm`, max 100 MB).
- `language`: Source language (`English`, `Telugu`, `Tanglish`, `Hindi`).
- `provider`: Optional transcription provider override (`local_whisper`, `production`, `mock`).

**Response (200 OK):**
```json
{
  "id": "vanalysis_7e8618eb2be1",
  "video": {
    "filename": "sample.mp4",
    "file_size_bytes": 4194304,
    "file_size_mb": 4.0,
    "duration_seconds": 15.0,
    "width": 1080,
    "height": 1920,
    "fps": 30.0,
    "has_audio": true,
    "format": "mp4"
  },
  "overall_score": 88,
  "overall_rating": "High Retention Potential",
  "summary": "Immediate contrarian hook followed by tight pacing and clear CTA directive.",
  "metrics": [
    {
      "id": "hook_strength",
      "label": "Hook Strength",
      "score": 92,
      "rating": "Excellent",
      "summary": "Opening speech begins at 0.2s with strong contrarian pattern interrupt.",
      "evidence": ["Instant speech onset at 0.2s", "Delivers 7 words in opening 3 seconds"],
      "recommendation": "Preserve this immediate vocal immediacy in future hooks."
    }
  ],
  "segments": [
    {
      "segment_id": "seg_1",
      "start_seconds": 0.2,
      "end_seconds": 3.2,
      "duration_seconds": 3.0,
      "transcript": "Stop shooting at 60fps right now.",
      "label": "HOOK",
      "confidence": 0.95,
      "observation": "Opening contrarian hook."
    }
  ],
  "findings": ["Strength (Hook Strength): Opening speech begins at 0.2s..."],
  "recommendations": ["Preserve this immediate vocal immediacy in future hooks."],
  "transcript": {
    "available": true,
    "language": "English",
    "text": "Stop shooting at 60fps right now...",
    "segment_count": 4,
    "word_count": 32,
    "words_per_second": 2.65,
    "silence_gaps_count": 1,
    "provider": "local_whisper"
  },
  "limitations": [],
  "analyzed_at": "2026-10-05T12:00:00Z",
  "provider_used": "local_whisper + deterministic_metrics"
}
```

### `GET /api/v1/video-analysis/{analysis_id}`
Retrieves a previously computed video audit by ID. Returns 404 if not found.

---

## 5. Creator Handoff Integration

The Video Retention Analyzer links directly with other CINEHA AI studios:
- **Open Script Analyzer**: Hands off the extracted spoken transcript and video metadata into `/analyzer` for deep 9-dimension screenplay retention auditing.
- **Open Script Optimizer**: Automatically translates video weaknesses (e.g. weak hook, conversational fluff, delayed CTA) into targeted `OptimizationGoalKey` directives and opens `/optimizer`.
- **Caption Studio**: Transcribed speech segments and micro-timings can be styled with 10 animated motion-graphic templates and rendered to final MP4.
