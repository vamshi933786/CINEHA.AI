# CINEHA AI — Multi-Agent Architecture Specification

This document details the architecture, schemas, and operational protocols of the 8 specialized agents comprising the CINEHA AI agent mesh.

---

## 1. Agent Inventory & Responsibilities

| Agent Name | Core Responsibility | Input Schema | Output Schema |
|---|---|---|---|
| **1. Orchestrator Agent** | Parses user intent, selects pipeline execution path, orchestrates child agents, aggregates telemetry. | `UserRequestPayload` | `WorkflowResultPayload` |
| **2. Trend Research Agent** | Synthesizes verified platform patterns, formats, and niche dynamics with citation tracking. | `TrendResearchQuery` | `TrendReportPayload` |
| **3. Content Research Agent** | Researches factual claims, background knowledge, and proof points for script topic. | `ContentResearchQuery` | `FactSheetPayload` |
| **4. Hook Analyst Agent** | Deploys 9-taxonomy psychological hooks tailored for 0–3s short-form retention. | `HookRequestPayload` | `HookCollectionPayload` |
| **5. Script Generator Agent** | Writes structured 2-column screenplay (Voiceover + Visual Directions + Overlays) in EN/TE/Tenglish. | `ScriptGenerationPayload` | `StructuredScriptPayload` |
| **6. Retention Review Agent**| Conducts rubric-based heuristic audit on hook velocity, narrative pacing, and CTA clarity. | `ScriptReviewPayload` | `ScriptAuditPayload` |
| **7. Script Optimizer Agent** | Computes structured diffs, refines language, and produces alternative hooks without altering core message. | `ScriptOptimizationPayload` | `OptimizedScriptPayload` |
| **8. Video Analysis Agent** | Evaluates video metadata, keyframe pacing, and audio clarity from uploaded MP4/MOV files. | `VideoAnalysisPayload` | `VideoAuditPayload` |

---

## 2. Agent Inter-Communication & Data Contracts

All agents communicate using strictly validated Pydantic schemas. Untyped dictionaries or free-form strings are prohibited across internal agent boundaries.

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Creator / Client
    participant Orch as Orchestrator Agent
    participant Hook as Hook Agent
    participant Script as Script Agent
    participant Review as Review Agent
    participant Opt as Optimizer Agent

    Creator->>Orch: POST /api/v1/scripts/generate (Intent & Profile)
    Orch->>Orch: Validate & Determine Pipeline ("full_screenplay")
    Orch->>Hook: Request 3 Hook Variations (Curiosity, Contrarian, Problem-Solution)
    Hook-->>Orch: Return HookCollectionPayload (selected best hook)
    Orch->>Script: Generate Script with Voiceover & Visual Beats
    Script-->>Orch: Return StructuredScriptPayload
    Orch->>Review: Audit Script for Pacing & Drop-off Points
    Review-->>Orch: Return ScriptAuditPayload (Score: 88, Critique: "Tighten hook beat 2")
    alt Optimization Threshold Triggered
        Orch->>Opt: Refine Script based on Review Critique
        Opt-->>Orch: Return OptimizedScriptPayload + Diff
    end
    Orch-->>Creator: Return Complete WorkflowResultPayload + Live Logs
```

---

## 3. Detailed Agent Schemas (Python / Pydantic)

### Common Base Models
```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import datetime

class PlatformEnum(str, Enum):
    REELS = "instagram_reels"
    TIKTOK = "tiktok"
    SHORTS = "youtube_shorts"

class LanguageEnum(str, Enum):
    ENGLISH = "en"
    TELUGU = "te"
    TENGLISH = "te_en"

class HookCategoryEnum(str, Enum):
    CURIOSITY = "curiosity"
    QUESTION = "question"
    PROBLEM_SOLUTION = "problem_solution"
    STORYTELLING = "storytelling"
    CONTRARIAN = "contrarian"
    DEMONSTRATION = "demonstration"
    EDUCATIONAL = "educational"
    VISUAL = "visual"
    PERSONAL_EXPERIENCE = "personal_experience"
```

### Script Agent Models
```python
class VisualBeat(BaseModel):
    timestamp_estimate: str = Field(..., description="Estimated timestamp e.g. 00:00 - 00:03")
    visual_direction: str = Field(..., description="Camera angle, movement, B-roll description")
    voiceover: str = Field(..., description="Spoken dialogue or voiceover script")
    text_overlay: Optional[str] = Field(None, description="On-screen text or caption hook")
    sound_design: Optional[str] = Field(None, description="Sound effect or music mood")

class StructuredScriptPayload(BaseModel):
    title: str
    target_duration_seconds: int
    estimated_duration_seconds: int
    language: LanguageEnum
    platform: PlatformEnum
    hook_category: HookCategoryEnum
    hook_text: str
    beats: List[VisualBeat]
    call_to_action: str
    estimated_word_count: int
    creator_notes: List[str]
```

### Review Agent Models
```python
class RubricMetric(BaseModel):
    name: str
    score: int = Field(..., ge=0, le=100)
    weight: float
    observation: str
    recommendation: str

class ScriptAuditPayload(BaseModel):
    overall_heuristic_score: int = Field(..., ge=0, le=100)
    hook_clarity_score: int
    pacing_velocity_score: int
    story_structure_score: int
    cta_effectiveness_score: int
    strengths: List[str]
    potential_drop_off_sections: List[str]
    actionable_revisions: List[str]
    disclaimer: str = "Heuristic assessment based on creator storytelling patterns; does not guarantee virality."
```

---

## 4. Resilience, Error Handling & Fallbacks

1. **Provider Abstraction:** An extensible `LLMProvider` protocol enables switching seamlessly between Google Gemini (e.g. Gemini 1.5/2.0), OpenAI, Anthropic, or an offline heuristic mock provider for hermetic testing.
2. **Circuit Breakers:** If an external LLM fails 3 consecutive times within 60 seconds, the circuit breaker opens and immediately routes to a secondary provider or cached fallback templates.
3. **Graceful Partial Output:** If the Review Agent times out, the Orchestrator does not discard the generated script; it delivers the valid script payload accompanied by an alert noting that heuristic review was bypassed.
4. **Secret Shield:** System prompts forbid echoing API keys, internal routing instructions, or user authentication tokens in any response attribute.
