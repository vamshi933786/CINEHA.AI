# CINEHA AI — Database Schema & Data Models

This document defines the relational database architecture, entity relationships, indexes, and migration strategies implemented via SQLAlchemy 2.0.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    CREATOR_PROFILE ||--o{ SCRIPT : creates
    CREATOR_PROFILE ||--o{ CONTENT_ITEM : schedules
    CREATOR_PROFILE ||--o{ RESEARCH_SESSION : conducts
    
    SCRIPT ||--|{ SCRIPT_VERSION : maintains
    SCRIPT ||--o{ SCRIPT_AUDIT : analyzed_by
    SCRIPT ||--o| CONTENT_ITEM : linked_to
    
    RESEARCH_SESSION ||--|{ RESEARCH_SOURCE : contains
    
    WORKFLOW_RUN ||--|{ AGENT_EVENT : emits

    CREATOR_PROFILE {
        string id PK
        string creator_name
        string brand_name
        string niche
        string target_audience
        json preferred_platforms
        string preferred_language
        string tone
        datetime created_at
        datetime updated_at
    }

    SCRIPT {
        string id PK
        string profile_id FK
        string title
        string platform
        string language
        int target_duration
        int estimated_duration
        json visual_beats
        string call_to_action
        int current_version
        datetime created_at
        datetime updated_at
    }

    SCRIPT_VERSION {
        string id PK
        string script_id FK
        int version_number
        string title
        json visual_beats
        string call_to_action
        string change_summary
        datetime created_at
    }

    SCRIPT_AUDIT {
        string id PK
        string script_id FK
        int heuristic_score
        int hook_clarity_score
        int pacing_score
        json strengths
        json drop_off_points
        json revisions
        datetime created_at
    }

    CONTENT_ITEM {
        string id PK
        string profile_id FK
        string script_id FK
        string title
        string platform
        string status
        date scheduled_date
        text notes
        datetime created_at
        datetime updated_at
    }

    RESEARCH_SESSION {
        string id PK
        string profile_id FK
        string topic
        string niche
        string platform
        json key_patterns
        datetime created_at
    }

    RESEARCH_SOURCE {
        string id PK
        string session_id FK
        string title
        string url
        string source_type
        boolean is_verified
        string notes
    }

    WORKFLOW_RUN {
        string id PK
        string pipeline_name
        string status
        int duration_ms
        int total_tokens
        datetime created_at
    }

    AGENT_EVENT {
        string id PK
        string run_id FK
        string agent_name
        string status
        int execution_ms
        json payload_summary
        datetime created_at
    }
```

---

## 2. Table Specifications & Indexes

1. **`creator_profiles`**
   - Primary Key: `id` (`VARCHAR(36)`, UUIDv4)
   - Indexes: `ix_creator_profiles_brand_name`

2. **`scripts`**
   - Primary Key: `id` (`VARCHAR(36)`, UUIDv4)
   - Foreign Key: `profile_id` references `creator_profiles.id` on delete CASCADE.
   - Indexes: `ix_scripts_platform`, `ix_scripts_created_at`, `ix_scripts_profile_id`

3. **`script_versions`**
   - Unique Composite Constraint: `(script_id, version_number)`
   - Indexes: `ix_script_versions_script_id`

4. **`content_items`**
   - Primary Key: `id` (`VARCHAR(36)`, UUIDv4)
   - Indexes: `ix_content_items_scheduled_date`, `ix_content_items_status`

---

## 3. Storage Engine Compatibility & Migrations

- **Development:** Zero-configuration SQLite (`sqlite+aiosqlite:///./cineha_ai.db`). All JSON columns are serialized safely using native `JSON` types supported across SQLite 3.38+ and PostgreSQL.
- **Production:** Fully compatible with PostgreSQL 15+ without code modifications via the `DATABASE_URL` environment variable.
- **Migration Engine:** Alembic for automatic schema evolution and rollback capability.
