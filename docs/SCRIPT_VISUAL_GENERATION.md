# CINEHAI AI — AI Visual Concepts & Image Generation

## 1. Overview

In short-form video creation, visual storytelling and clear explanations are critical for retention. The **AI Visual Concepts** system in CINEHAI AI analyzes screenplays, identifies moments where complex ideas, comparisons, diagrams, or metaphors benefit from visual aids, generates AI images using pluggable generation providers, and attaches those visuals directly to script beats.

```
                  ┌──────────────────────────────┐
                  │        SCRIPT STUDIO         │
                  │  (Screenplay Beats & Dialog) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  AI Visual Concept Analysis  │
                  │  (Gemini LLM / Heuristic)    │
                  └──────────────┬───────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
Concept Opportunities                                   Multilingual
(Diagram, Process, Comparison,                     (Telugu, Tanglish,
 Metaphor, Product, Data)                           English Preserved)
     │                                                       │
     └───────────────────────────┬───────────────────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Image Generation Provider    │
                  │ (DALL-E 3 / Mock / Unconfig) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Attached to Script Beat     │
                  │  (Preview, Edit, Regenerate) │
                  └──────────────────────────────┘
```

---

## 2. Core Capabilities

1. **Intelligent Script Analysis**:
   - Scans screenplay beats, voiceover, and visual directions.
   - Identifies high-leverage opportunities:
     - `Diagram`: Technical or structured layouts (e.g., 180° shutter rule).
     - `Comparison`: Side-by-side or before/after distinctions.
     - `Process`: Step-by-step sequential workflows.
     - `Metaphor`: Conceptual analogies that make abstractions concrete.
     - `Product Context`: Physical object or setup illustrations.
     - `Data Explanation`: Charts, graphs, or statistical visualizations.
     - `Minimal Illustration`: Clean, distraction-free visual markers.

2. **Multilingual Conceptual Fidelity**:
   - Concept titles and explanations strictly respect the script's language contract:
     - **English** &rarr; English
     - **Telugu (తెలుగు)** &rarr; Pure Unicode Telugu without forced English translation
     - **Tanglish** &rarr; Latin-script Telugu as spoken by creators
   - Image generation prompts are automatically synthesized in detailed descriptive English for optimal diffusion model rendering.

3. **Pluggable Image Generation Architecture**:
   - Clear provider abstraction (`BaseImageGenerationProvider`).
   - Clean diagnostics when no provider is configured (`IMAGE_PROVIDER="unconfigured"`).
   - Local mock generation (`IMAGE_PROVIDER="mock"`) for development and automated testing using Python Pillow (PIL).
   - Production OpenAI DALL-E 3 / DALL-E 2 provider (`IMAGE_PROVIDER="openai"`).
   - Designed to easily plug into Google Imagen or Stability AI.

4. **Script Beat Attachment ("Use in Script")**:
   - Creators can attach or detach generated visuals from specific beats with a single click.
   - Screenplay text, voiceover, and timings remain completely intact and unmodified.
   - Script beats render dedicated visual preview callouts in the screenplay editor.

---

## 3. Architecture & Backend Implementation

### Data Model (`ScriptVisual`)

Located in `apps/api/app/models/script.py`:

```python
class ScriptVisual(Base):
    __tablename__ = "script_visuals"

    id = Column(String, primary_key=True)
    script_id = Column(String, ForeignKey("scripts.id", ondelete="CASCADE"), nullable=False)
    script_version_id = Column(String, ForeignKey("script_versions.id", ondelete="SET NULL"), nullable=True)
    segment_id = Column(String, nullable=False)
    concept_title = Column(String, nullable=False)
    explanation = Column(Text, nullable=False)
    visual_type = Column(String, nullable=False)
    importance = Column(String, default="Recommended")
    related_script_text = Column(Text, nullable=False)
    suggested_prompt = Column(Text, nullable=False)
    prompt = Column(Text, nullable=False)
    aspect_ratio = Column(String, default="9:16")
    style = Column(String, default="Clean Educational")
    language = Column(String, default="English")
    status = Column(String, default="suggested")  # suggested, generating, ready, failed
    image_asset_reference = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    model = Column(String, nullable=True)
    placement = Column(String, nullable=True)
    is_attached = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Image Provider Abstraction

Located in `apps/api/app/services/image_generation/`:

- `base.py`: Defines `BaseImageGenerationProvider` and `ImageGenerationResult`.
- `unconfigured_provider.py`: Returns diagnostic HTTP 400 error (`"Image generation provider is not configured"`). Never fakes AI output.
- `mock_provider.py`: Draws realistic colored cards with title, style, aspect ratio watermark, and timestamp using PIL.
- `openai_provider.py`: Connects to OpenAI DALL-E 3 / DALL-E 2 with configurable sizes and response parsing.
- `__init__.py`: Factory `get_image_generation_provider()`.

### Visual Concept Agent

Located in `apps/api/app/agents/visual_concept_agent.py`:
- `analyze_script_for_visuals`: Coordinates persona retrieval from `CreatorProfile`, resolves language, calls LLM provider, and persists suggestions to SQLite.
- `generate_image_for_visual`: Executes image generation, writes PNG bytes to `uploads/visuals/`, and updates database records.
- `regenerate_image_for_visual`: Allows re-running generation with updated prompt, style, or aspect ratio.
- `update_visual`: Updates prompt, style, aspect ratio, or `is_attached` state.
- `delete_visual`: Cleans up local disk assets and database records.

### REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/scripts/{script_id}/visual-concepts/status` | Diagnostic provider availability & model info |
| `POST` | `/api/v1/scripts/{script_id}/visual-concepts` | Analyze script and generate visual opportunities |
| `GET` | `/api/v1/scripts/{script_id}/visuals` | Fetch all visual concept items for a script |
| `POST` | `/api/v1/scripts/{script_id}/visuals/{visual_id}/generate` | Generate image for a concept |
| `POST` | `/api/v1/scripts/{script_id}/visuals/{visual_id}/regenerate` | Regenerate image with modified prompt or style |
| `PUT` | `/api/v1/scripts/{script_id}/visuals/{visual_id}` | Update prompt, aspect ratio, style, or attachment |
| `DELETE` | `/api/v1/scripts/{script_id}/visuals/{visual_id}` | Remove visual concept and delete local image file |
| `GET` | `/api/v1/scripts/{script_id}/visuals/{visual_id}/image` | Stream saved image file from disk |

---

## 4. Frontend Workspace & Components

1. **`VisualConceptsSection.tsx`**:
   - Mounts below `ScriptPreview` in `ScriptWorkspace`.
   - Header with visual opportunities count badge.
   - Provider diagnostic alert banner (shows status if unconfigured or active model).
   - `[ Analyze Script for Visuals ]` trigger button with spinner.
   - Responsive grid of `VisualConceptCard` components.
   - Attached visuals gallery strip.

2. **`VisualConceptCard.tsx`**:
   - Aspect ratio container (`9:16`, `1:1`, `16:9`).
   - Image preview with fullscreen modal preview.
   - Type and importance pills (`Essential`, `Recommended`, `Optional`).
   - Style dropdown (`Clean Educational`, `Cinematic`, `Modern 3D`, `Minimal Illustration`, `Editorial`, `Realistic`, `Infographic-style`).
   - Aspect ratio selector.
   - Accordion for **Advanced Prompt Editing** and "Copy Prompt" button.
   - Action controls: `Generate Image`, `Regenerate`, `Use in Script`, and `Remove`.

3. **`ScriptSegment.tsx`**:
   - When `attachedVisual` is present, renders a callout badge:
     - Aspect ratio and visual type pills.
     - Thumbnail preview.
     - Concept title and explanation.

---

## 5. Configuration & Environment Variables

Configure in `.env` (or backend environment):

```bash
# Image Generation Provider
# Options: "unconfigured" (default in dev), "mock", "openai"
IMAGE_PROVIDER="unconfigured"

# OpenAI API Key (required if IMAGE_PROVIDER="openai")
IMAGE_GENERATION_API_KEY=""

# Model to use (e.g., "dall-e-3", "dall-e-2")
IMAGE_MODEL="dall-e-3"

# Local Storage Directory
IMAGE_STORAGE_DIR="uploads/visuals"
```

---

## 6. Verification & Test Suite

### Backend Tests
- **File**: `apps/api/tests/test_visual_concepts.py`
- **Coverage**:
  - `GET /visual-concepts/status` unconfigured check
  - `POST /visual-concepts` analysis flow
  - Multilingual concept title preservation (Telugu Unicode and Tanglish)
  - Mock image generation & file serving
  - Unconfigured provider error handling (clean 400 error, no fake images)
  - Regeneration with custom prompt
  - Visual attachment toggle (`is_attached`)
  - Deletion of visual and asset cleanup
- **Result**: 12/12 passing (244/244 total backend tests passing).

### Frontend Tests
- **File**: `apps/web/tests/visualConcepts.test.tsx`
- **Coverage**:
  - Provider status banner rendering (configured vs unconfigured)
  - "Analyze Script for Visuals" user interaction
  - Multilingual rendering without forced English fallback
  - Advanced prompt editing accordion
  - Generation and Regeneration button triggers
  - "Use in Script" attachment toggle
  - ScriptSegment attached visual rendering
- **Result**: 10/10 passing (261/261 total frontend tests passing).
- **TypeScript**: `npx tsc --noEmit` &rarr; 0 errors.
- **Production Build**: `next build` &rarr; 15/15 pages compiled cleanly.
