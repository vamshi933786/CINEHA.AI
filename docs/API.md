# CINEHA AI — REST API Specification

Base URL: `http://localhost:8000/api/v1`  
Swagger Interactive Docs: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`

---

## 1. System Endpoints

### `GET /health`
Returns the operational health of the API server, database connectivity, and configured AI providers.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "active_provider": "gemini_pro",
  "timestamp": "2026-09-28T12:00:00Z"
}
```

---

## 2. Creator Profile Endpoints

### `GET /profile`
Retrieves the saved creator persona and generation preferences.

### `PUT /profile`
Updates creator persona (niche, target audience, preferred language, tone, CTA style).

**Request Body:**
```json
{
  "creator_name": "Sai Panga",
  "brand_name": "Cinehashoots",
  "niche": "Cinematography & Mobile Filmmaking",
  "target_audience": "Beginner creators & aspiring DP/editors",
  "preferred_platforms": ["instagram_reels", "youtube_shorts"],
  "content_style": "High aesthetic, practical breakdowns, cinematic B-roll",
  "preferred_language": "te_en",
  "tone": "Authoritative yet encouraging",
  "cta_style": "Save this reel for your next shoot"
}
```

---

## 3. Hook Generation Endpoints

### `POST /hooks/generate`
Generates high-retention opening hooks categorized across the 9 hook taxonomies.

**Request Body:**
```json
{
  "topic": "Cinematic lighting setup using a single household lamp",
  "target_audience": "Beginner creators",
  "platform": "instagram_reels",
  "language": "te_en",
  "count": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "hooks": [
    {
      "id": "hook_1",
      "category": "contrarian",
      "hook_text": "Stop spending ₹50,000 on studio lights when your bedside lamp can do this.",
      "visual_opening": "Extreme close-up of a cheap bulb flipping on, cutting instantly to a moody cinematic portrait.",
      "delivery_style": "Confident, brisk, conversational",
      "explanation": "Disrupts the common beginner belief that expensive gear is mandatory."
    }
  ]
}
```

---

## 4. Script Generation & Orchestration Endpoints

### `POST /scripts/generate`
Executes the multi-agent screenplay generation pipeline.

**Request Body:**
```json
{
  "topic": "3 Golden Rules for Smooth Gimbal Movements",
  "platform": "instagram_reels",
  "target_duration_seconds": 45,
  "language": "te_en",
  "tone": "Dynamic & Educational",
  "hook_id_or_text": null,
  "include_review": true,
  "include_optimization": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "workflow_id": "wf_abc123",
  "script": {
    "id": "scr_9876",
    "title": "3 Golden Rules for Smooth Gimbal Movements",
    "platform": "instagram_reels",
    "language": "te_en",
    "target_duration_seconds": 45,
    "estimated_duration_seconds": 42,
    "beats": [
      {
        "timestamp_estimate": "00:00 - 00:03",
        "visual_direction": "Fast whip-pan transition, camera operator in full ninja-walk stance",
        "voiceover": "Meeru gimbal konnaru kani mee footage inka shaky ga untunda?",
        "text_overlay": "Gimbal Ninja Walk Secrets",
        "sound_design": "Whoosh SFX + Subtle bass drop"
      }
    ],
    "call_to_action": "Comment 'GIMBAL' and I will send you my free camera balance checklist.",
    "version": 1
  },
  "review": {
    "overall_score": 91,
    "strengths": ["Immediate visual hook", "Clear physical demonstration cue"],
    "actionable_revisions": []
  }
}
```

### `POST /scripts/analyze`
Analyzes a creator-pasted script for retention, pacing, and story structure.

### `POST /scripts/optimize`
Performs targeted rewrites and generates visual diffs against an existing script.

---

## 5. Trend & Research Endpoints

### `POST /research/trends`
Queries niche patterns, viral formats, and verified citations.

### `GET /research/history`
Retrieves past research queries and source archives.

---

## 6. Video Analysis & Video → Script Endpoints

### `POST /videos/process`
Unified processing endpoint executing multimodal video inspection and returning dual outputs: comprehensive video analysis and reconstructed structured script.

**Form Data / JSON Body:**
- `file`: (Optional if `video_url` is provided) Binary video file (MP4, MOV, WEBM up to **100 MB**; enforced via `MAX_VIDEO_SIZE_MB=100`).
- `video_url`: (Optional if `file` is provided) Public YouTube or Instagram Reel URL. Strictly complies with platform access policies; does not bypass authentication or DRM.
- `platform`: `instagram_reels` | `tiktok` | `youtube_shorts`
- `output_mode`: `both` | `analysis_only` | `script_only` (default: `both`)

**Response (200 OK):**
```json
{
  "success": true,
  "video_metadata": {
    "filename": "cinematic_walk.mp4",
    "duration_seconds": 32.4,
    "resolution": "1080x1920",
    "aspect_ratio": "9:16",
    "framerate": 30.0,
    "file_size_mb": 42.1
  },
  "video_analysis": {
    "hook_evaluation": "Strong 0-2s visual hook with whip-pan camera move.",
    "story_structure": "Three distinct tips clearly delimited by visual cutaways.",
    "visual_composition": "Good rule-of-thirds framing, high aesthetic contrast.",
    "audio_clarity": "Voice is crisp; background music level is well-balanced (-14dB).",
    "pacing_score": 92,
    "suitability": "Highly aligned with Instagram Reels best practices.",
    "actionable_recommendations": [
      "Add larger subtitles during the transition at 00:14.",
      "Trim the closing 2 seconds to make the loop seamless."
    ]
  },
  "extracted_script": {
    "title": "Reconstructed Script: Cinematic Gimbal Walk",
    "dialogue_transcript": "Stop holding your gimbal like a selfie stick. Here are three ninja walk secrets you need today...",
    "beats": [
      {
        "timestamp": "00:00 - 00:03",
        "transcript": "Stop holding your gimbal like a selfie stick.",
        "visual_description": "Creator demonstrates incorrect rigid walking stance, exaggerated shaky movement.",
        "on_screen_text": "DON'T HOLD IT LIKE THIS ❌",
        "audio_cues": "Upbeat lo-fi beat, abrupt record scratch SFX."
      },
      {
        "timestamp": "00:03 - 00:10",
        "transcript": "Bend your knees, lock your elbows, and heel-to-toe step.",
        "visual_description": "Side-profile shot illustrating bent knees and smooth creeping motion.",
        "on_screen_text": "TIP 1: BEND KNEES & HEEL-TO-TOE",
        "audio_cues": "Smooth synth riser."
      }
    ],
    "call_to_action": "Follow for daily mobile cinematography breakdowns."
  }
}
```

---

## 7. Content Calendar Endpoints

- `GET /calendar` — List planned items filtered by date range or status.
- `POST /calendar` — Create a scheduled content entry (linked to script ID).
- `PUT /calendar/{id}` — Update status (`idea`, `scripted`, `recording`, `editing`, `scheduled`, `published`).
- `DELETE /calendar/{id}` — Delete calendar entry.

---

## 8. Video Retention Analyzer Endpoints

### `POST /video-analysis/analyze`
Multipart video ingest and audit. Validates container header (MP4, MOV, WebM up to 100MB), extracts technical metadata via FFmpeg, transcribes speech with Local Whisper (+ Two-Stage Hybrid Telugu restoration), calculates 10 standardized retention criteria (0–100), and enriches with Gemini semantic qualitative critique.

**Form Data:**
- `file`: Video binary stream (MP4, MOV, WebM, <= 100 MB).
- `language`: Source language (`English`, `Telugu`, `Tanglish`, `Hindi`).
- `provider`: Optional provider override (`local_whisper`, `production`, `mock`).

**Response (200 OK):** `VideoAnalysisResponse` with `video` metadata, `overall_score`, `metrics` (10 items), `segments` (timed structural beats), `findings`, `recommendations`, `transcript`, and `limitations`.

### `GET /video-analysis/{analysis_id}`
Retrieves a previously computed video audit by ID. Returns 404 if the record does not exist.

