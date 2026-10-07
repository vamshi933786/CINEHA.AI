import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.schemas.extraction import (
    NormalizedScriptResponse,
    SaveImportedScriptRequest,
    VideoURLExtractionRequest,
    VideoURLScriptExtraction,
    GenerateScriptFromURLRequest,
)
from app.services.video_url.extraction_service import get_video_url_extraction_service
from app.services.document_extractor import (
    extract_from_text,
    extract_from_pdf,
    extract_from_docx,
    extract_from_image,
)
from app.services.script_parser import parse_script_text_to_segments
from app.models.creator_profile import CreatorProfile
from app.models.script import Script, ScriptVersion, ScriptVisual
from app.schemas.script import (
    ScriptGenerationRequest,
    ScriptUpdateRequest,
    ScriptResponse,
    ScriptVersionResponse,
)
from app.schemas.visual_concept import (
    VisualConceptAnalysisRequest,
    VisualConceptResponse,
    GenerateImageRequest,
    VisualUpdateRequest,
    VisualProviderStatusResponse,
)
from app.schemas.analyzer import ScriptAnalysisResponse, ScriptAnalysisRequest
from app.schemas.optimizer import (
    ScriptOptimizationRequest,
    ScriptOptimizationResponse,
    SaveOptimizedScriptRequest,
)
from app.agents.script_agent import get_script_agent, ScriptAgent
from app.agents.retention_analyzer_agent import get_retention_analyzer_agent, RetentionAnalyzerAgent
from app.agents.script_optimizer_agent import get_script_optimizer_agent, ScriptOptimizerAgent
from app.agents.visual_concept_agent import get_visual_concept_agent, VisualConceptAgent

router = APIRouter()


@router.post(
    "/scripts/generate",
    response_model=ScriptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Structured Script",
    description="Transforms a creator topic and hook into a full, time-coded short-form screenplay and saves Version 1.",
)
async def generate_script(
    payload: ScriptGenerationRequest,
    db: AsyncSession = Depends(get_db),
    agent: ScriptAgent = Depends(get_script_agent),
) -> ScriptResponse:
    # Resolve creator profile
    db_profile: Optional[CreatorProfile] = None
    if payload.profile_id:
        result = await db.execute(
            select(CreatorProfile).where(CreatorProfile.id == payload.profile_id)
        )
        db_profile = result.scalar_one_or_none()

    if db_profile is None:
        # Fall back to the most recent creator profile if available
        result = await db.execute(
            select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
        )
        db_profile = result.scalar_one_or_none()

    # Generate script content via ScriptAgent
    generated = await agent.generate(request=payload, db_profile=db_profile)

    # Persist Script entity
    script_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())

    resolved_tone = (
        payload.tone
        if payload.tone and payload.tone.strip()
        else (", ".join(db_profile.content_tones) if db_profile and db_profile.content_tones else "Cinematic, Engaging")
    )

    script = Script(
        id=script_id,
        profile_id=db_profile.id if db_profile else None,
        title=generated["title"],
        topic=payload.topic,
        platform=payload.platform,
        language=payload.language,
        duration_seconds=payload.duration_seconds,
        tone=resolved_tone,
        hook=generated["hook"],
        segments=generated["segments"],
        cta=generated["cta"],
        provider_used=generated["provider_used"],
        current_version=1,
    )
    db.add(script)

    # Create Version 1
    script_version = ScriptVersion(
        id=version_id,
        script_id=script_id,
        version_number=1,
        title=generated["title"],
        segments=generated["segments"],
        hook=generated["hook"],
        cta=generated["cta"],
        change_summary="Initial generation",
        provider_used=generated["provider_used"],
    )
    db.add(script_version)

    await db.commit()

    # Reload script with versions loaded
    stmt = (
        select(Script)
        .options(selectinload(Script.versions))
        .where(Script.id == script_id)
    )
    result = await db.execute(stmt)
    saved_script = result.scalar_one()

    return ScriptResponse.model_validate(saved_script)


@router.get(
    "/scripts",
    response_model=List[ScriptResponse],
    status_code=status.HTTP_200_OK,
    summary="List Scripts",
    description="Retrieves all generated scripts ordered by most recently updated.",
)
async def list_scripts(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> List[ScriptResponse]:
    stmt = (
        select(Script)
        .options(selectinload(Script.versions))
        .order_by(Script.updated_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    scripts = result.scalars().all()
    return [ScriptResponse.model_validate(s) for s in scripts]


@router.get(
    "/scripts/{script_id}",
    response_model=ScriptResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Script by ID",
    description="Retrieves a specific script and its active version.",
)
async def get_script(
    script_id: str,
    db: AsyncSession = Depends(get_db),
) -> ScriptResponse:
    stmt = (
        select(Script)
        .options(selectinload(Script.versions))
        .where(Script.id == script_id)
    )
    result = await db.execute(stmt)
    script = result.scalar_one_or_none()

    if script is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Script with ID '{script_id}' not found.",
        )

    return ScriptResponse.model_validate(script)


@router.put(
    "/scripts/{script_id}",
    response_model=ScriptResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Script and Save New Version",
    description="Updates script segments, dialogue, or direction, preserving version history by committing a new ScriptVersion.",
)
async def update_script(
    script_id: str,
    payload: ScriptUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> ScriptResponse:
    stmt = (
        select(Script)
        .options(selectinload(Script.versions))
        .where(Script.id == script_id)
    )
    result = await db.execute(stmt)
    script = result.scalar_one_or_none()

    if script is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Script with ID '{script_id}' not found.",
        )

    # Increment version counter
    next_version_num = script.current_version + 1
    script.current_version = next_version_num

    # Update mutable fields
    if payload.title is not None:
        script.title = payload.title
    if payload.hook is not None:
        script.hook = payload.hook
    if payload.segments is not None:
        script.segments = [s.model_dump() for s in payload.segments]
    if payload.cta is not None:
        script.cta = payload.cta

    # Create new ScriptVersion preserving immutable history
    version_id = str(uuid.uuid4())
    change_summary = payload.change_summary or f"Version {next_version_num} manual edits"

    new_version = ScriptVersion(
        id=version_id,
        script_id=script.id,
        version_number=next_version_num,
        title=script.title,
        segments=script.segments,
        hook=script.hook,
        cta=script.cta,
        change_summary=change_summary,
        provider_used=script.provider_used,
    )
    db.add(new_version)

    await db.commit()

    # Re-query script with updated versions list
    stmt_reload = (
        select(Script)
        .options(selectinload(Script.versions))
        .where(Script.id == script_id)
    )
    reload_result = await db.execute(stmt_reload)
    updated_script = reload_result.scalar_one()

    return ScriptResponse.model_validate(updated_script)


@router.get(
    "/scripts/{script_id}/versions",
    response_model=List[ScriptVersionResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Script Version History",
    description="Returns all historical versions recorded for the specified script.",
)
async def get_script_versions(
    script_id: str,
    db: AsyncSession = Depends(get_db),
) -> List[ScriptVersionResponse]:
    # Check if script exists
    script_check = await db.execute(
        select(Script.id).where(Script.id == script_id)
    )
    if script_check.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Script with ID '{script_id}' not found.",
        )

    stmt = (
        select(ScriptVersion)
        .where(ScriptVersion.script_id == script_id)
        .order_by(ScriptVersion.version_number.desc())
    )
    result = await db.execute(stmt)
    versions = result.scalars().all()

    return [ScriptVersionResponse.model_validate(v) for v in versions]


@router.post(
    "/scripts/{script_id}/analyze",
    response_model=ScriptAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Script Retention",
    description="Loads a saved script by ID and performs a 9-dimension retention diagnostic audit.",
)
async def analyze_script_endpoint(
    script_id: str,
    db: AsyncSession = Depends(get_db),
    agent: RetentionAnalyzerAgent = Depends(get_retention_analyzer_agent),
) -> ScriptAnalysisResponse:
    return await agent.analyze(
        request=ScriptAnalysisRequest(script_id=script_id),
        db=db,
    )


@router.post(
    "/scripts/optimize-custom",
    response_model=ScriptOptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Optimize Custom or Unsaved Script",
    description="Optimizes screenplay text or custom beats without requiring prior database persistence.",
)
async def optimize_custom_script_endpoint(
    payload: ScriptOptimizationRequest,
    db: AsyncSession = Depends(get_db),
    agent: ScriptOptimizerAgent = Depends(get_script_optimizer_agent),
) -> ScriptOptimizationResponse:
    return await agent.optimize_custom(
        request=payload,
        db=db,
    )


@router.post(
    "/scripts/{script_id}/optimize",
    response_model=ScriptOptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Script Optimization Preview",
    description="Optimizes an existing screenplay against chosen retention goals and generates before/after diagnostics without overwriting the script.",
)
async def optimize_script_endpoint(
    script_id: str,
    payload: ScriptOptimizationRequest,
    db: AsyncSession = Depends(get_db),
    agent: ScriptOptimizerAgent = Depends(get_script_optimizer_agent),
) -> ScriptOptimizationResponse:
    return await agent.optimize(
        script_id=script_id,
        request=payload,
        db=db,
    )


@router.post(
    "/scripts/{script_id}/save-optimized",
    response_model=ScriptResponse,
    status_code=status.HTTP_200_OK,
    summary="Save Optimized Script Version",
    description="Explicitly commits an optimized script as a new immutable ScriptVersion, preserving previous versions.",
)
async def save_optimized_endpoint(
    script_id: str,
    payload: SaveOptimizedScriptRequest,
    db: AsyncSession = Depends(get_db),
    agent: ScriptOptimizerAgent = Depends(get_script_optimizer_agent),
) -> ScriptResponse:
    return await agent.save_optimized(
        script_id=script_id,
        payload=payload,
        db=db,
    )


@router.post(
    "/scripts/extract",
    response_model=NormalizedScriptResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract & Normalize Script from Input",
    description="Extracts normalized script text from plain text, PDF, DOCX, or Image OCR.",
)
async def extract_script_endpoint(
    source_type: str = Form(..., description="Source type: text, pdf, docx, or image"),
    text: Optional[str] = Form(None, description="Raw text if source_type is text"),
    language: str = Form("English", description="Script language: English, Telugu, Tanglish"),
    file: Optional[UploadFile] = File(None, description="Uploaded document or image file"),
) -> NormalizedScriptResponse:
    source_lower = source_type.lower().strip()
    if source_lower == "text":
        if not text or not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No script text provided to extract.",
            )
        result = extract_from_text(text=text, language=language)
    elif source_lower in ("pdf", "docx", "image"):
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File upload is required for {source_lower.upper()} extraction.",
            )
        file_bytes = await file.read()
        filename = file.filename or f"uploaded.{source_lower}"

        if source_lower == "pdf":
            result = extract_from_pdf(pdf_bytes=file_bytes, filename=filename, language=language)
        elif source_lower == "docx":
            result = extract_from_docx(docx_bytes=file_bytes, filename=filename, language=language)
        else:  # image
            result = await extract_from_image(image_bytes=file_bytes, filename=filename, language=language)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported source type '{source_type}'. Must be text, pdf, docx, or image.",
        )

    return NormalizedScriptResponse.model_validate(result.to_dict())


@router.post(
    "/scripts/save-imported",
    response_model=ScriptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Imported Script",
    description="Saves a normalized script directly into the database as Version 1.",
)
async def save_imported_script(
    payload: SaveImportedScriptRequest,
    db: AsyncSession = Depends(get_db),
) -> ScriptResponse:
    result = await db.execute(
        select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
    )
    db_profile = result.scalar_one_or_none()

    parsed_hook, parsed_cta, segments = parse_script_text_to_segments(
        payload.text, duration_seconds=payload.duration_seconds or 30
    )

    script_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())

    resolved_tone = (
        db_profile.content_tones[0]
        if (db_profile and db_profile.content_tones)
        else "Cinematic"
    )

    source_type = payload.source_type or "text"
    provider_used = "video_url_import" if source_type == "video_url" else "unified_input_import"

    script = Script(
        id=script_id,
        profile_id=db_profile.id if db_profile else None,
        title=payload.title.strip(),
        topic=payload.topic.strip() if payload.topic else payload.title.strip(),
        platform=payload.platform or "Instagram Reels",
        language=payload.language or "English",
        duration_seconds=payload.duration_seconds or 30,
        tone=resolved_tone,
        hook=parsed_hook or payload.title.strip(),
        segments=segments,
        cta=parsed_cta or "Follow for more",
        provider_used=provider_used,
        source_type=source_type,
        source_url=payload.source_url,
        source_platform=payload.source_platform,
        original_video_title=payload.original_video_title,
        extraction_method=payload.extraction_method,
        current_version=1,
    )
    db.add(script)

    script_version = ScriptVersion(
        id=version_id,
        script_id=script_id,
        version_number=1,
        title=payload.title.strip(),
        segments=segments,
        hook=parsed_hook or payload.title.strip(),
        cta=parsed_cta or "Follow for more",
        change_summary="Imported via Video URL" if source_type == "video_url" else "Imported via Unified Script Input",
        provider_used=provider_used,
    )
    db.add(script_version)

    await db.commit()

    stmt = (
        select(Script)
        .options(selectinload(Script.versions))
        .where(Script.id == script_id)
    )
    res = await db.execute(stmt)
    saved = res.scalar_one()

    return ScriptResponse.model_validate(saved)


@router.post(
    "/scripts/extract-from-url",
    response_model=VideoURLScriptExtraction,
    status_code=status.HTTP_200_OK,
    summary="Extract Script from YouTube or Instagram URL",
    description="Validates URL, prevents SSRF, retrieves public captions or transcribes audio using local Whisper, and returns editable script text.",
)
async def extract_script_from_url_endpoint(
    payload: VideoURLExtractionRequest,
) -> VideoURLScriptExtraction:
    service = get_video_url_extraction_service()
    result = await service.extract_from_url(
        url=payload.url,
        language=payload.language,
    )
    return result


@router.post(
    "/scripts/generate-from-url",
    response_model=ScriptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Screenplay from Extracted Video Script",
    description="Adapts an extracted video script into a brand-new time-coded screenplay based on the user's selected adaptation goal and creator profile.",
)
async def generate_script_from_url_endpoint(
    payload: GenerateScriptFromURLRequest,
    db: AsyncSession = Depends(get_db),
    agent: ScriptAgent = Depends(get_script_agent),
) -> ScriptResponse:
    # Resolve creator profile
    db_profile: Optional[CreatorProfile] = None
    if payload.profile_id:
        result = await db.execute(
            select(CreatorProfile).where(CreatorProfile.id == payload.profile_id)
        )
        db_profile = result.scalar_one_or_none()

    if db_profile is None:
        result = await db.execute(
            select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
        )
        db_profile = result.scalar_one_or_none()

    # Generate adapted screenplay via ScriptAgent
    generated = await agent.generate_from_extracted_video(request=payload, db_profile=db_profile)

    script_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())

    resolved_tone = (
        db_profile.content_tones[0]
        if (db_profile and db_profile.content_tones)
        else "Cinematic, High-Retention"
    )

    detected_platform = (
        "YouTube"
        if ("youtube" in payload.url.lower() or "youtu.be" in payload.url.lower())
        else "Instagram"
    )

    script = Script(
        id=script_id,
        profile_id=db_profile.id if db_profile else None,
        title=generated["title"],
        topic=payload.original_video_title or generated.get("topic") or "Video Adaptation",
        platform=payload.platform or "Instagram Reels",
        language=payload.language or "English",
        duration_seconds=payload.duration_seconds or 30,
        tone=resolved_tone,
        hook=generated["hook"],
        segments=generated["segments"],
        cta=generated["cta"],
        provider_used=generated.get("provider_used", "video_url_adaptation"),
        source_type="video_url",
        source_url=payload.url,
        source_platform=detected_platform,
        original_video_title=payload.original_video_title,
        extraction_method=f"ai_adaptation_{payload.goal.lower().replace(' ', '_')}",
        current_version=1,
    )
    db.add(script)

    script_version = ScriptVersion(
        id=version_id,
        script_id=script_id,
        version_number=1,
        title=generated["title"],
        segments=generated["segments"],
        hook=generated["hook"],
        cta=generated["cta"],
        change_summary=f"Adapted from {detected_platform} video via goal: {payload.goal}",
        provider_used=generated.get("provider_used", "video_url_adaptation"),
    )
    db.add(script_version)

    await db.commit()

    stmt = (
        select(Script)
        .options(selectinload(Script.versions))
        .where(Script.id == script_id)
    )
    res = await db.execute(stmt)
    saved = res.scalar_one()

    return ScriptResponse.model_validate(saved)


# =====================================================================
# AI VISUAL CONCEPTS & IMAGE GENERATION ENDPOINTS
# =====================================================================

@router.get(
    "/scripts/{script_id}/visual-concepts/status",
    response_model=VisualProviderStatusResponse,
    summary="Get Image Generation Provider Status",
    description="Returns whether an AI image generation provider is configured and available.",
)
async def get_visual_provider_status_endpoint(
    script_id: str,
    agent: VisualConceptAgent = Depends(get_visual_concept_agent),
) -> VisualProviderStatusResponse:
    info = await agent.get_provider_status()
    return VisualProviderStatusResponse(**info)


@router.post(
    "/scripts/{script_id}/visual-concepts",
    response_model=List[VisualConceptResponse],
    summary="Analyze Script for Visual Concepts",
    description="Discovers high-impact visual explanation opportunities across script segments and generates structured prompts.",
)
async def analyze_visual_concepts_endpoint(
    script_id: str,
    payload: VisualConceptAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    agent: VisualConceptAgent = Depends(get_visual_concept_agent),
) -> List[VisualConceptResponse]:
    visuals = await agent.analyze_and_store_concepts(script_id=script_id, request=payload, db=db)
    return [VisualConceptResponse.model_validate(v) for v in visuals]


@router.get(
    "/scripts/{script_id}/visuals",
    response_model=List[VisualConceptResponse],
    summary="List Script Visuals",
    description="Returns all visual concepts and generated visual attachments for a script.",
)
async def get_script_visuals_endpoint(
    script_id: str,
    db: AsyncSession = Depends(get_db),
    agent: VisualConceptAgent = Depends(get_visual_concept_agent),
) -> List[VisualConceptResponse]:
    visuals = await agent.get_visuals_for_script(script_id=script_id, db=db)
    return [VisualConceptResponse.model_validate(v) for v in visuals]


@router.post(
    "/scripts/{script_id}/visuals/{visual_id}/generate",
    response_model=VisualConceptResponse,
    summary="Generate AI Image for Visual Concept",
    description="Invokes the configured image generation provider to produce a visual asset for the concept.",
)
async def generate_visual_image_endpoint(
    script_id: str,
    visual_id: str,
    payload: GenerateImageRequest,
    db: AsyncSession = Depends(get_db),
    agent: VisualConceptAgent = Depends(get_visual_concept_agent),
) -> VisualConceptResponse:
    visual = await agent.generate_visual_image(
        script_id=script_id, visual_id=visual_id, request=payload, db=db
    )
    return VisualConceptResponse.model_validate(visual)


@router.post(
    "/scripts/{script_id}/visuals/{visual_id}/regenerate",
    response_model=VisualConceptResponse,
    summary="Regenerate AI Image for Visual Concept",
    description="Regenerates an image asset with optional prompt or style modifications.",
)
async def regenerate_visual_image_endpoint(
    script_id: str,
    visual_id: str,
    payload: GenerateImageRequest,
    db: AsyncSession = Depends(get_db),
    agent: VisualConceptAgent = Depends(get_visual_concept_agent),
) -> VisualConceptResponse:
    visual = await agent.generate_visual_image(
        script_id=script_id, visual_id=visual_id, request=payload, db=db
    )
    return VisualConceptResponse.model_validate(visual)


@router.put(
    "/scripts/{script_id}/visuals/{visual_id}",
    response_model=VisualConceptResponse,
    summary="Update Visual Concept",
    description="Updates prompt, style, aspect ratio, or attachment status for a visual concept.",
)
async def update_visual_endpoint(
    script_id: str,
    visual_id: str,
    payload: VisualUpdateRequest,
    db: AsyncSession = Depends(get_db),
    agent: VisualConceptAgent = Depends(get_visual_concept_agent),
) -> VisualConceptResponse:
    visual = await agent.update_visual(
        script_id=script_id, visual_id=visual_id, request=payload, db=db
    )
    return VisualConceptResponse.model_validate(visual)


@router.delete(
    "/scripts/{script_id}/visuals/{visual_id}",
    summary="Delete Visual Concept",
    description="Removes a visual concept and its associated local image file.",
)
async def delete_visual_endpoint(
    script_id: str,
    visual_id: str,
    db: AsyncSession = Depends(get_db),
    agent: VisualConceptAgent = Depends(get_visual_concept_agent),
) -> dict:
    success = await agent.delete_visual(script_id=script_id, visual_id=visual_id, db=db)
    return {"deleted": success, "id": visual_id}


@router.get(
    "/scripts/{script_id}/visuals/{visual_id}/image",
    summary="Serve Generated Visual Image",
    description="Streams the generated PNG image asset securely.",
)
async def serve_visual_image_endpoint(
    script_id: str,
    visual_id: str,
    db: AsyncSession = Depends(get_db),
    agent: VisualConceptAgent = Depends(get_visual_concept_agent),
):
    file_path = await agent.get_image_file_path(script_id=script_id, visual_id=visual_id, db=db)
    return FileResponse(file_path, media_type="image/png")

