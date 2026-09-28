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

## 6. Video Analysis Endpoints

### `POST /videos/analyze`
Accepts `multipart/form-data` video files (MP4/MOV up to 50MB) for pacing, audio clarity, and visual opening audit.

**Form Data:**
- `file`: binary video file
- `platform`: `instagram_reels` | `tiktok` | `youtube_shorts`

---

## 7. Content Calendar Endpoints

- `GET /calendar` — List planned items filtered by date range or status.
- `POST /calendar` — Create a scheduled content entry (linked to script ID).
- `PUT /calendar/{id}` — Update status (`idea`, `scripted`, `recording`, `editing`, `scheduled`, `published`).
- `DELETE /calendar/{id}` — Delete calendar entry.
