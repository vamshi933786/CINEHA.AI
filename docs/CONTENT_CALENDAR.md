# CINEHAI AI — Content Calendar & Content Planning Engine

## Overview

The **Content Calendar & Content Planning Engine** is CINEHAI AI's central content orchestration hub. It connects creator persona identity, brainstormed content ideas, hooks, scripts, video analyses, and publishing schedules into a unified workflow.

```
┌─────────────────────────────────────────────────────────────┐
│                    Creator Persona Engine                   │
│          (Niche, Voice, Content Pillars, Languages)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Content Calendar & Planner                  │
│       ┌──────────────┬──────────────┬──────────────┐        │
│       │  Month View  │  Week View   │ Agenda View  │        │
│       └──────────────┴──────────────┴──────────────┘        │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Script Studio & AI      │ │   Video Analysis & Audit   │
│  (Script, Versions, Audit)   │ │ (Retention, Pacing, Cues)  │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## Key Features

1. **Multi-View Content Scheduling**:
   - **Month View**: Standard 35/42-cell calendar grid displaying scheduled content badges, status color-dots, today indicators, and quick schedule button (`+`) per day.
   - **Week View**: 7-day schedule view with expanded day columns, time slots, pillar chips, and quick scheduling.
   - **Agenda View**: Chronological timeline of upcoming content grouped by date.

2. **Drag-and-Drop Rescheduling**:
   - HTML5 native drag-and-drop support: drag any content card to another date on Month or Week views to instantly reschedule.
   - Optimistic UI updates with instant user feedback and backend synchronization.

3. **Creator Persona Integration**:
   - Live banner dynamically connects with the creator's active persona profile (`display_name`, `niche`, `content_pillars`).
   - Content items inherit and validate creator content pillars.

4. **Multi-Asset Relational Linking**:
   - **Script Studio**: Bidirectional links (`script_id`, `script_version_id`) allow jumping directly to script editing, Retention Analyzer, or Script Optimizer.
   - **Video Analysis**: Links (`video_analysis_id`) display audit scores and findings, with 1-click navigation to the video analysis workspace.

5. **AI Content Plan Generator**:
   - Powered by Gemini with resilient offline/fallback synthesis.
   - Automatically generates multi-day content plans (7, 14, or 30 days) adhering to chosen posting cadences (`1/week` to `Daily`), creator pillars, and niche.
   - Step 2 interactive suggestion preview allows selecting, deselecting, and batch-adding planned items directly to the calendar.

6. **Content Lifecycle & Status Pipeline**:
   - `Idea` → `Planned` → `Script Ready` → `In Production` → `Ready to Publish` → `Published` → `Archived`
   - Platform support: Instagram Reels, YouTube Shorts, TikTok, Facebook Reels, and Other.
   - Priority tagging: Low, Medium, High, Urgent.

7. **Zero Social Media Auto-Publishing Promise**:
   - CINEHAI AI is strictly a planning and production orchestration tool. It does **not** perform automated direct publishing to creator social channels, maintaining full creator agency.

---

## Data Model

Stored in SQLite (`content_items` table):

| Field | Type | Description |
|---|---|---|
| `id` | VARCHAR(36) | Primary Key (UUID) |
| `title` | VARCHAR(255) | Content title |
| `description` | TEXT | Concept summary |
| `scheduled_date` | VARCHAR(10) | Date in ISO `YYYY-MM-DD` |
| `scheduled_time` | VARCHAR(5) | 24-hour time `HH:MM` |
| `status` | VARCHAR(32) | Lifecycle stage |
| `platform` | VARCHAR(32) | Platform target |
| `content_type` | VARCHAR(32) | Video format/genre |
| `language` | VARCHAR(32) | Language target |
| `content_pillar` | VARCHAR(64) | Assigned creator pillar |
| `content_goal` | VARCHAR(64) | Target business goal |
| `priority` | VARCHAR(16) | Priority level |
| `tags` | JSON | Tag array |
| `notes` | TEXT | Production notes |
| `cta` | VARCHAR(255) | Call to action |
| `script_id` | VARCHAR(36) | Foreign key to `scripts.id` |
| `script_version_id`| INTEGER | Specific script version number |
| `video_analysis_id`| VARCHAR(36) | Foreign key to `video_analyses.id` |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

---

## REST API Endpoints

- `GET /api/v1/calendar`: List content items with optional query filters (`start_date`, `end_date`, `status`, `platform`, `priority`, `content_pillar`, `search`).
- `GET /api/v1/calendar/{id}`: Get content item details including linked script summary and video analysis summary.
- `POST /api/v1/calendar`: Create a new content item.
- `PUT /api/v1/calendar/{id}`: Update an existing content item.
- `DELETE /api/v1/calendar/{id}`: Delete a content item.
- `POST /api/v1/calendar/{id}/duplicate`: Duplicate an item with optional date shift (e.g. `shift_days=7`).
- `GET /api/v1/calendar/stats/dashboard`: Aggregated dashboard metrics across statuses, platforms, and content pillars.
- `POST /api/v1/calendar/generate-plan`: Generate AI content plan suggestions based on creator persona and preferences.
