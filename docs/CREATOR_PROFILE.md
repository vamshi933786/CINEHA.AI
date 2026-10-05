# CINEHA AI — Creator Profile & Persona Engine

## Overview

The **Creator Profile & Persona Engine** (`/profile`) is the central intelligence backbone of CINEHA AI. Rather than treating creator preferences as a simple form, this module transforms user identity, audience demographics, voice delivery matrix, content pillars, and brand rules into an authoritative, persistent **Creator Persona Context**.

This context is injected across all downstream AI generation pipelines:
- **Hook Generator**: Calibrates opening hook angles, vocabulary, and audience resonance.
- **Script Studio**: Drives storytelling pacing, energy level, bilingual code-switching, and intros.
- **Retention Analyzer**: Evaluates script effectiveness relative to audience sophistication and pain points.
- **Script Optimizer**: Enforces signature phrases, banned words, and brand style rules.

---

## 1. Domain Architecture

The Creator Persona Engine organizes preferences into **7 Core Domains**:

| Domain | Key Fields | Purpose |
| :--- | :--- | :--- |
| **1. Identity** | `creator_name`, `display_name`, `creator_type`, `creator_bio`, `location` | Brand handle, creator archetype (Filmmaker, Educator, etc.), and bio |
| **2. Content & Pillars** | `niche` (primary), `secondary_niches`, `content_pillars`, `topics_to_avoid` | Channel scope, core pillars, and strictly excluded topics |
| **3. Audience Persona** | `target_audience`, `target_audience_age`, `audience_sophistication`, `audience_interests`, `audience_pain_points` | Viewer demographics, skill level, interests, and pain points |
| **4. Voice & Delivery Matrix** | `content_tones`, `energy`, `humor`, `storytelling_style`, `vocabulary`, `custom_tone_notes` | Vocal energy (Calm, High-energy), humor, and storytelling cadence |
| **5. Distribution & Platforms** | `platforms`, `preferred_aspect_ratio`, `typical_duration`, `cta_style`, `secondary_cta_styles`, `content_goals` | Distribution formats (9:16, 16:9), durations, and CTA defaults |
| **6. Language & Script** | `primary_language` (English, Telugu, Tanglish), `secondary_languages`, `script_preference` | Linguistic mode and alphabet preference (Latin / Telugu script) |
| **7. Brand Guidance & Rules** | `brand_positioning`, `core_message`, `words_to_use`, `words_to_avoid`, `style_rules` | Channel motto, signature catchphrases, banned clichés, and style rules |

---

## 2. API Contracts & Endpoints

### `GET /api/v1/profile`
Retrieves the saved creator profile along with deterministic completeness scoring.

**Response Structure (200 OK):**
```json
{
  "profile": {
    "id": "c1f7b7e2-...",
    "creator_name": "Sai Panga",
    "display_name": "@cinehashoots",
    "creator_type": "Filmmaker",
    "location": "Hyderabad, India",
    "niche": "Cinematography",
    "secondary_niches": ["Lighting", "Color Grading"],
    "content_pillars": ["Camera Angles", "Mobile Filmmaking"],
    "topics_to_avoid": ["Politics"],
    "target_audience": "Aspiring filmmakers and creators",
    "target_audience_age": "18–24",
    "audience_sophistication": "Intermediate",
    "audience_interests": ["DaVinci Resolve", "Smartphone filmmaking"],
    "audience_pain_points": ["Shaky video", "Poor lighting"],
    "content_tones": ["Educational", "Cinematic", "Conversational"],
    "energy": "High-energy",
    "humor": "Light",
    "storytelling_style": "Story-driven",
    "vocabulary": "Balanced",
    "primary_language": "Tanglish",
    "secondary_languages": ["Telugu"],
    "script_preference": "Tanglish / Romanized Telugu",
    "platforms": ["Instagram Reels", "YouTube Shorts"],
    "preferred_aspect_ratio": "9:16",
    "typical_duration": "45 sec",
    "cta_style": "Save",
    "secondary_cta_styles": ["Follow"],
    "content_goals": ["Increase retention", "Build personal brand"],
    "brand_positioning": "Practical mobile filmmaking without cinema cameras",
    "core_message": "Tell big stories with small gear",
    "words_to_use": ["Cinema look", "Frame cheddam"],
    "words_to_avoid": ["Don't forget to like"],
    "style_rules": ["Hook in first 2 seconds"],
    "completeness": {
      "score": 100,
      "categories": [
        { "category": "Identity & Bio", "completed": true, "weight": 15, "details": "Name and creator profile defined" },
        { "category": "Niche & Content Pillars", "completed": true, "weight": 20, "details": "Niche and content pillars set" },
        { "category": "Target Audience", "completed": true, "weight": 20, "details": "Target audience demographics defined" },
        { "category": "Voice & Delivery Style", "completed": true, "weight": 15, "details": "Delivery tone and energy calibrated" },
        { "category": "Language & Script Preference", "completed": true, "weight": 10, "details": "Primary language set to Tanglish" },
        { "category": "Target Platforms", "completed": true, "weight": 10, "details": "2 distribution platform(s) selected" },
        { "category": "Brand Guidance & CTA", "completed": true, "weight": 10, "details": "Call-to-action or brand rules established" }
      ],
      "recommendations": []
    },
    "created_at": "2026-09-28T12:00:00Z",
    "updated_at": "2026-10-05T14:00:00Z"
  },
  "is_configured": true
}
```

### `PUT /api/v1/profile`
Creates or updates the creator persona profile idempotently. Persists extended list fields with deduplication.

### `GET /api/v1/profile/persona`
Returns the distilled `CreatorPersonaContext` formatted specifically for AI Agent system prompts.

### `POST /api/v1/profile/generate-summary`
Generates an AI synthesized persona summary, example hook, intro, and call-to-action using Gemini with deterministic fallback.

---

## 3. Completeness Scoring Formula

Completeness is calculated deterministically on both backend and client (for instant zero-lag feedback while editing):

$$\text{Completeness} = \sum_{i=1}^{7} W_i \cdot C_i$$

1. **Identity & Bio** (15%): `creator_name` AND (`creator_bio` OR `creator_type`).
2. **Niche & Content Pillars** (20%): `niche` AND non-empty `content_pillars`.
3. **Target Audience** (20%): `target_audience` OR non-empty `audience_pain_points` / `audience_interests`.
4. **Voice & Delivery Style** (15%): non-empty `content_tones` AND (`energy` OR `storytelling_style` OR `custom_tone_notes`).
5. **Language & Script Preference** (10%): `primary_language` selected.
6. **Target Platforms** (10%): non-empty `platforms` selected.
7. **Brand Guidance & CTA** (10%): `cta_style` OR (`brand_positioning` / `words_to_use` / `style_rules`).

Score range: **0–100%**. Incomplete profiles can still be saved without blocking.

---

## 4. Downstream AI Agent Integration

`CreatorPersonaContext` is consumed by:

1. **Hook Agent (`hook_agent.py`)**:
   - Injects creator voice, energy, vocabulary level, and topics to avoid into the system prompt.
   - Tailors hook formats to target audience pain points and sophistication.

2. **Script Agent (`script_agent.py`)**:
   - Injects storytelling style, default CTA style, and signature words to use.
   - Enforces brand style rules (e.g. "Hook within first 2.5s", "No clickbait").
   - Follows script alphabet preference (Latin Tanglish vs native Telugu script).

3. **Retention Analyzer & Script Optimizer**:
   - Compares pacing against `typical_duration`.
   - Flags banned words (`words_to_avoid`) in retention diagnostics.
