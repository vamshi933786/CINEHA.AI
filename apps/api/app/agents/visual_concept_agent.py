import os
import uuid
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.script import Script, ScriptVisual
from app.models.creator_profile import CreatorProfile
from app.schemas.visual_concept import (
    VisualConceptAnalysisRequest,
    GenerateImageRequest,
    VisualUpdateRequest,
)
from app.services.llm_provider import get_llm_provider
from app.services.image_generation import (
    get_image_generation_provider,
    ProviderNotConfiguredError,
    ImageGenerationError,
)
from app.services.script_language_detector import normalize_language_contract

logger = logging.getLogger(__name__)


class VisualConceptAgent:
    """Agent managing visual concept analysis and AI image generation lifecycle."""

    def __init__(self):
        self.llm_provider = get_llm_provider()
        self.image_provider = get_image_generation_provider()

    async def get_provider_status(self) -> Dict[str, Any]:
        """Returns provider configuration details for UI diagnostics."""
        is_cfg = self.image_provider.is_configured()
        prov_name = self.image_provider.get_provider_name()
        mod_name = self.image_provider.get_model_name()
        msg = (
            f"Image generation is ready with {prov_name.upper()} ({mod_name})."
            if is_cfg
            else "Image generation provider is not configured. Visual concepts and prompts can be analyzed, but image generation requires configuring an image provider."
        )
        return {
            "configured": is_cfg,
            "provider": prov_name,
            "model": mod_name,
            "message": msg,
        }

    async def analyze_and_store_concepts(
        self,
        script_id: str,
        request: VisualConceptAnalysisRequest,
        db: AsyncSession,
    ) -> List[ScriptVisual]:
        """Analyzes a script, discovers high-value visual opportunities, and persists them."""
        # 1. Fetch script
        stmt = select(Script).where(Script.id == script_id)
        res = await db.execute(stmt)
        script = res.scalar_one_or_none()
        if not script:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Script with ID {script_id} not found.",
            )

        # 2. Fetch Creator Profile if available
        profile_id = request.profile_id or script.profile_id
        db_profile: Optional[CreatorProfile] = None
        if profile_id:
            p_stmt = select(CreatorProfile).where(CreatorProfile.id == profile_id)
            p_res = await db.execute(p_stmt)
            db_profile = p_res.scalar_one_or_none()

        if not db_profile:
            p_stmt = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
            p_res = await db.execute(p_stmt)
            db_profile = p_res.scalar_one_or_none()

        persona_dict: Dict[str, Any] = {}
        if db_profile:
            persona_dict = {
                "niche": db_profile.niche,
                "tones": db_profile.content_tones or ["Engaging"],
                "content_pillars": db_profile.content_pillars or [],
                "target_audience": db_profile.target_audience or "Social video viewers",
                "brand_positioning": db_profile.brand_positioning,
                "preferred_aspect_ratio": db_profile.preferred_aspect_ratio or "9:16",
            }

        # 3. Resolve language priority: Request > Script > Profile > English
        target_language = (
            request.language
            or script.language
            or (db_profile.primary_language if db_profile else "English")
            or "English"
        )
        norm_language = normalize_language_contract(target_language)

        # 4. Resolve segments to analyze
        segments_to_analyze = request.segments if request.segments else (script.segments or [])
        if not segments_to_analyze:
            # Fall back to single beat from script topic/hook
            segments_to_analyze = [
                {
                    "id": "seg_0",
                    "section": "HOOK",
                    "start_time": "0:00",
                    "end_time": "0:04",
                    "voiceover": script.hook or script.title,
                }
            ]

        preferred_ar = request.preferred_aspect_ratio or persona_dict.get("preferred_aspect_ratio") or "9:16"
        preferred_style = request.preferred_style or "Clean Educational"

        # 5. Execute LLM analysis
        concepts_data = await self.llm_provider.analyze_visual_concepts(
            title=request.title or script.title,
            topic=request.topic or script.topic,
            platform=request.platform or script.platform,
            language=norm_language,
            segments=segments_to_analyze,
            preferred_aspect_ratio=preferred_ar,
            preferred_style=preferred_style,
            creator_persona=persona_dict,
        )

        # 6. Store in database
        persisted_visuals: List[ScriptVisual] = []
        for c in concepts_data:
            visual_id = str(uuid.uuid4())
            sv = ScriptVisual(
                id=visual_id,
                script_id=script.id,
                script_version_id=str(script.current_version),
                segment_id=str(c.get("script_segment_id", "seg_0")),
                concept_title=c.get("concept_title", "Visual Concept"),
                explanation=c.get("explanation", ""),
                visual_type=c.get("visual_type", "Concept Illustration"),
                importance=c.get("importance", "Recommended"),
                related_script_text=c.get("related_script_text", ""),
                suggested_prompt=c.get("suggested_prompt", ""),
                prompt=c.get("prompt") or c.get("suggested_prompt", ""),
                aspect_ratio=c.get("aspect_ratio") or preferred_ar,
                style=c.get("style") or preferred_style,
                language=norm_language,
                status="suggested",
                placement=c.get("placement"),
                is_attached=False,
            )
            db.add(sv)
            persisted_visuals.append(sv)

        await db.commit()

        # Refresh
        refreshed_stmt = select(ScriptVisual).where(ScriptVisual.script_id == script.id).order_by(ScriptVisual.created_at.asc())
        res_refreshed = await db.execute(refreshed_stmt)
        return list(res_refreshed.scalars().all())

    async def get_visuals_for_script(self, script_id: str, db: AsyncSession) -> List[ScriptVisual]:
        """Retrieves all visual concepts for a script."""
        stmt = (
            select(ScriptVisual)
            .where(ScriptVisual.script_id == script_id)
            .order_by(ScriptVisual.created_at.asc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def generate_visual_image(
        self,
        script_id: str,
        visual_id: str,
        request: GenerateImageRequest,
        db: AsyncSession,
    ) -> ScriptVisual:
        """Generates an image for a visual concept using configured provider and stores locally."""
        stmt = (
            select(ScriptVisual)
            .where(ScriptVisual.id == visual_id, ScriptVisual.script_id == script_id)
        )
        res = await db.execute(stmt)
        visual = res.scalar_one_or_none()
        if not visual:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visual concept with ID {visual_id} not found for script {script_id}.",
            )

        # Check if provider is configured
        if not self.image_provider.is_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image generation provider is not configured.",
            )

        # Update prompt/style/aspect_ratio overrides if provided
        active_prompt = request.prompt.strip() if request.prompt and request.prompt.strip() else visual.prompt
        active_style = request.style.strip() if request.style and request.style.strip() else visual.style
        active_ar = request.aspect_ratio.strip() if request.aspect_ratio and request.aspect_ratio.strip() else visual.aspect_ratio

        visual.prompt = active_prompt
        visual.style = active_style
        visual.aspect_ratio = active_ar
        visual.status = "generating"
        visual.error_message = None
        await db.commit()

        try:
            gen_result = await self.image_provider.generate_image(
                prompt=active_prompt,
                settings={
                    "aspect_ratio": active_ar,
                    "style": active_style,
                },
            )

            # Ensure local asset directory exists
            storage_path = Path(settings.IMAGE_STORAGE_DIR)
            storage_path.mkdir(parents=True, exist_ok=True)

            # Save image using secure UUID filename
            filename = f"visual_{uuid.uuid4().hex}.png"
            file_path = storage_path / filename

            with open(file_path, "wb") as f:
                f.write(gen_result.image_bytes)

            visual.image_asset_reference = str(file_path.resolve())
            visual.image_url = f"/api/v1/scripts/{script_id}/visuals/{visual_id}/image"
            visual.provider = gen_result.provider
            visual.model = gen_result.model
            visual.status = "ready"
            visual.error_message = None

            await db.commit()
            await db.refresh(visual)
            return visual

        except ProviderNotConfiguredError as pne:
            visual.status = "failed"
            visual.error_message = str(pne)
            await db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(pne))
        except ImageGenerationError as ige:
            visual.status = "failed"
            visual.error_message = str(ige)
            await db.commit()
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Image generation failed: {str(ige)}")
        except Exception as ex:
            logger.error(f"Unexpected error generating visual image: {ex}", exc_info=True)
            visual.status = "failed"
            visual.error_message = "Image generation failed. Your script is unchanged."
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Image generation failed. Your script is unchanged.",
            )

    async def update_visual(
        self,
        script_id: str,
        visual_id: str,
        request: VisualUpdateRequest,
        db: AsyncSession,
    ) -> ScriptVisual:
        """Updates properties of a visual concept, e.g. prompt, attachment status."""
        stmt = (
            select(ScriptVisual)
            .where(ScriptVisual.id == visual_id, ScriptVisual.script_id == script_id)
        )
        res = await db.execute(stmt)
        visual = res.scalar_one_or_none()
        if not visual:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visual concept with ID {visual_id} not found.",
            )

        if request.prompt is not None and request.prompt.strip():
            visual.prompt = request.prompt.strip()
        if request.style is not None and request.style.strip():
            visual.style = request.style.strip()
        if request.aspect_ratio is not None and request.aspect_ratio.strip():
            visual.aspect_ratio = request.aspect_ratio.strip()
        if request.is_attached is not None:
            visual.is_attached = request.is_attached

        await db.commit()
        await db.refresh(visual)
        return visual

    async def delete_visual(self, script_id: str, visual_id: str, db: AsyncSession) -> bool:
        """Deletes a visual concept and its local asset if present."""
        stmt = (
            select(ScriptVisual)
            .where(ScriptVisual.id == visual_id, ScriptVisual.script_id == script_id)
        )
        res = await db.execute(stmt)
        visual = res.scalar_one_or_none()
        if not visual:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visual concept with ID {visual_id} not found.",
            )

        # Remove local file if exists
        if visual.image_asset_reference:
            try:
                p = Path(visual.image_asset_reference)
                if p.is_file():
                    p.unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"Could not delete image file {visual.image_asset_reference}: {e}")

        await db.delete(visual)
        await db.commit()
        return True

    async def get_image_file_path(self, script_id: str, visual_id: str, db: AsyncSession) -> Path:
        """Safely verifies and returns the image file path for FileResponse."""
        stmt = (
            select(ScriptVisual)
            .where(ScriptVisual.id == visual_id, ScriptVisual.script_id == script_id)
        )
        res = await db.execute(stmt)
        visual = res.scalar_one_or_none()
        if not visual or not visual.image_asset_reference:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found for this visual concept.",
            )

        file_path = Path(visual.image_asset_reference).resolve()
        storage_base = Path(settings.IMAGE_STORAGE_DIR).resolve()

        # Path traversal guard
        if not str(file_path).startswith(str(storage_base)) and not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image asset not found.",
            )

        if not file_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image file does not exist on disk.",
            )

        return file_path


def get_visual_concept_agent() -> VisualConceptAgent:
    return VisualConceptAgent()
