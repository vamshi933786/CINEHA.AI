import json
import logging
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func

from app.core.database import get_db
from app.models.content_item import ContentItem
from app.models.script import Script, ScriptVersion
from app.models.video_analysis import VideoAnalysis
from app.models.creator_profile import CreatorProfile
from app.schemas.content_item import (
    ContentItemCreate,
    ContentItemUpdate,
    ContentItemResponse,
    LinkedScriptSummary,
    LinkedVideoAnalysisSummary,
    ContentPlanSuggestion,
    GenerateContentPlanRequest,
    GenerateContentPlanResponse,
    CalendarDashboardStats,
    VALID_STATUSES,
    VALID_PLATFORMS,
    VALID_CONTENT_TYPES,
)
from app.services.llm_provider import get_llm_provider, GeminiLLMProvider

logger = logging.getLogger(__name__)

router = APIRouter()

def build_content_item_response(item: ContentItem) -> ContentItemResponse:
    script_summary = None
    if item.script:
        script_summary = LinkedScriptSummary(
            id=item.script.id,
            title=item.script.title,
            current_version=item.script.current_version,
            duration_seconds=item.script.duration_seconds,
            language=item.script.language,
            updated_at=item.script.updated_at,
        )

    video_analysis_summary = None
    if item.video_analysis:
        top_finding = None
        if item.video_analysis.findings and len(item.video_analysis.findings) > 0:
            first_f = item.video_analysis.findings[0]
            if isinstance(first_f, dict):
                top_finding = first_f.get("title") or first_f.get("finding")
            elif isinstance(first_f, str):
                top_finding = first_f

        video_analysis_summary = LinkedVideoAnalysisSummary(
            id=item.video_analysis.id,
            filename=item.video_analysis.filename,
            overall_score=item.video_analysis.overall_score,
            overall_rating=item.video_analysis.overall_rating,
            top_finding=top_finding,
            created_at=item.video_analysis.created_at,
        )

    return ContentItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        scheduled_date=item.scheduled_date,
        scheduled_time=item.scheduled_time,
        status=item.status,
        platform=item.platform,
        content_type=item.content_type,
        language=item.language,
        script_id=item.script_id,
        script_version_id=item.script_version_id,
        hook_id=item.hook_id,
        video_analysis_id=item.video_analysis_id,
        content_pillar=item.content_pillar,
        content_goal=item.content_goal,
        priority=item.priority,
        tags=item.tags or [],
        notes=item.notes,
        cta=item.cta,
        created_at=item.created_at,
        updated_at=item.updated_at,
        script_summary=script_summary,
        video_analysis_summary=video_analysis_summary,
    )


@router.get(
    "/calendar",
    response_model=List[ContentItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List Scheduled Content Items",
    description="Returns content items filtered by date range, status, platform, content type, pillar, priority, or search term.",
)
async def list_content_items(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by planning status"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    content_pillar: Optional[str] = Query(None, description="Filter by pillar"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search in title, description, or tags"),
    db: AsyncSession = Depends(get_db),
) -> List[ContentItemResponse]:
    conditions = []

    if start_date:
        conditions.append(ContentItem.scheduled_date >= start_date)
    if end_date:
        conditions.append(ContentItem.scheduled_date <= end_date)
    if status_filter:
        conditions.append(ContentItem.status == status_filter)
    if platform:
        conditions.append(ContentItem.platform == platform)
    if content_type:
        conditions.append(ContentItem.content_type == content_type)
    if content_pillar:
        conditions.append(ContentItem.content_pillar == content_pillar)
    if priority:
        conditions.append(ContentItem.priority == priority)

    if search:
        search_term = f"%{search.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(ContentItem.title).like(search_term),
                func.lower(ContentItem.description).like(search_term),
                func.lower(ContentItem.notes).like(search_term),
            )
        )

    stmt = (
        select(ContentItem)
        .where(and_(*conditions))
        .order_by(ContentItem.scheduled_date.asc(), ContentItem.scheduled_time.asc())
    )

    result = await db.execute(stmt)
    items = result.scalars().all()
    return [build_content_item_response(i) for i in items]


@router.get(
    "/calendar/stats/dashboard",
    response_model=CalendarDashboardStats,
    status_code=status.HTTP_200_OK,
    summary="Get Content Calendar Dashboard Analytics",
    description="Returns aggregate planned items, ready-to-publish counts, platform breakdown, and pillar coverage.",
)
async def get_calendar_dashboard_stats(
    db: AsyncSession = Depends(get_db),
) -> CalendarDashboardStats:
    result = await db.execute(select(ContentItem))
    items = result.scalars().all()

    total_items = len(items)
    planned_count = sum(1 for i in items if i.status == "Planned")
    ready_to_publish_count = sum(1 for i in items if i.status in ["Ready to Publish", "Script Ready"])
    published_count = sum(1 for i in items if i.status == "Published")

    platform_breakdown: Dict[str, int] = {}
    content_type_breakdown: Dict[str, int] = {}
    pillar_coverage: Dict[str, int] = {}

    for i in items:
        plat = i.platform or "Other"
        platform_breakdown[plat] = platform_breakdown.get(plat, 0) + 1

        ctype = i.content_type or "Other"
        content_type_breakdown[ctype] = content_type_breakdown.get(ctype, 0) + 1

        if i.content_pillar:
            pillar_coverage[i.content_pillar] = pillar_coverage.get(i.content_pillar, 0) + 1

    return CalendarDashboardStats(
        total_items=total_items,
        planned_count=planned_count,
        ready_to_publish_count=ready_to_publish_count,
        published_count=published_count,
        platform_breakdown=platform_breakdown,
        content_type_breakdown=content_type_breakdown,
        pillar_coverage=pillar_coverage,
    )


@router.get(
    "/calendar/{item_id}",
    response_model=ContentItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Scheduled Content Item by ID",
)
async def get_content_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
) -> ContentItemResponse:
    stmt = select(ContentItem).where(ContentItem.id == item_id)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content item '{item_id}' not found.",
        )

    return build_content_item_response(item)


@router.post(
    "/calendar",
    response_model=ContentItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule New Content Item",
    description="Creates a new content planning item with optional references to existing scripts and video analyses.",
)
async def create_content_item(
    payload: ContentItemCreate,
    db: AsyncSession = Depends(get_db),
) -> ContentItemResponse:
    # Validate linked script if provided
    if payload.script_id:
        s_result = await db.execute(select(Script).where(Script.id == payload.script_id))
        if not s_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Referenced Script '{payload.script_id}' does not exist.",
            )

    # Validate linked video analysis if provided
    if payload.video_analysis_id:
        v_result = await db.execute(select(VideoAnalysis).where(VideoAnalysis.id == payload.video_analysis_id))
        if not v_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Referenced Video Analysis '{payload.video_analysis_id}' does not exist.",
            )

    item = ContentItem(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time.strip() if payload.scheduled_time else None,
        status=payload.status,
        platform=payload.platform,
        content_type=payload.content_type,
        language=payload.language,
        script_id=payload.script_id,
        script_version_id=payload.script_version_id,
        hook_id=payload.hook_id,
        video_analysis_id=payload.video_analysis_id,
        content_pillar=payload.content_pillar.strip() if payload.content_pillar else None,
        content_goal=payload.content_goal.strip() if payload.content_goal else None,
        priority=payload.priority,
        tags=payload.tags or [],
        notes=payload.notes.strip() if payload.notes else None,
        cta=payload.cta.strip() if payload.cta else None,
    )

    db.add(item)
    await db.flush()
    await db.refresh(item)

    # Query with relationships loaded
    stmt = select(ContentItem).where(ContentItem.id == item.id)
    refreshed = (await db.execute(stmt)).scalar_one()

    return build_content_item_response(refreshed)


@router.put(
    "/calendar/{item_id}",
    response_model=ContentItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Scheduled Content Item",
)
async def update_content_item(
    item_id: str,
    payload: ContentItemUpdate,
    db: AsyncSession = Depends(get_db),
) -> ContentItemResponse:
    stmt = select(ContentItem).where(ContentItem.id == item_id)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content item '{item_id}' not found.",
        )

    # Validate linked script if updated
    if payload.script_id is not None:
        if payload.script_id != "":
            s_result = await db.execute(select(Script).where(Script.id == payload.script_id))
            if not s_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Referenced Script '{payload.script_id}' does not exist.",
                )
            item.script_id = payload.script_id
        else:
            item.script_id = None
            item.script_version_id = None

    # Validate linked video analysis if updated
    if payload.video_analysis_id is not None:
        if payload.video_analysis_id != "":
            v_result = await db.execute(select(VideoAnalysis).where(VideoAnalysis.id == payload.video_analysis_id))
            if not v_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Referenced Video Analysis '{payload.video_analysis_id}' does not exist.",
                )
            item.video_analysis_id = payload.video_analysis_id
        else:
            item.video_analysis_id = None

    if payload.title is not None:
        item.title = payload.title.strip()
    if payload.description is not None:
        item.description = payload.description.strip() if payload.description else None
    if payload.scheduled_date is not None:
        item.scheduled_date = payload.scheduled_date
    if payload.scheduled_time is not None:
        item.scheduled_time = payload.scheduled_time.strip() if payload.scheduled_time else None
    if payload.status is not None:
        item.status = payload.status
    if payload.platform is not None:
        item.platform = payload.platform
    if payload.content_type is not None:
        item.content_type = payload.content_type
    if payload.language is not None:
        item.language = payload.language
    if payload.script_version_id is not None:
        item.script_version_id = payload.script_version_id if payload.script_version_id else None
    if payload.hook_id is not None:
        item.hook_id = payload.hook_id if payload.hook_id else None
    if payload.content_pillar is not None:
        item.content_pillar = payload.content_pillar.strip() if payload.content_pillar else None
    if payload.content_goal is not None:
        item.content_goal = payload.content_goal.strip() if payload.content_goal else None
    if payload.priority is not None:
        item.priority = payload.priority
    if payload.tags is not None:
        item.tags = payload.tags
    if payload.notes is not None:
        item.notes = payload.notes.strip() if payload.notes else None
    if payload.cta is not None:
        item.cta = payload.cta.strip() if payload.cta else None

    item.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(item)

    refreshed = (await db.execute(select(ContentItem).where(ContentItem.id == item.id))).scalar_one()
    return build_content_item_response(refreshed)


@router.delete(
    "/calendar/{item_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Scheduled Content Item",
)
async def delete_content_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    stmt = select(ContentItem).where(ContentItem.id == item_id)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content item '{item_id}' not found.",
        )

    await db.delete(item)
    return {"deleted": True, "id": item_id}


@router.post(
    "/calendar/{item_id}/duplicate",
    response_model=ContentItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate Content Item",
    description="Duplicates an existing content item with optional shift in scheduled days.",
)
async def duplicate_content_item(
    item_id: str,
    shift_days: int = Query(0, description="Days to shift the new scheduled date (+1, +7, etc.)"),
    db: AsyncSession = Depends(get_db),
) -> ContentItemResponse:
    stmt = select(ContentItem).where(ContentItem.id == item_id)
    result = await db.execute(stmt)
    original = result.scalar_one_or_none()

    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Original content item '{item_id}' not found.",
        )

    # Compute shifted date
    try:
        orig_d = datetime.strptime(original.scheduled_date, "%Y-%m-%d").date()
        new_d = orig_d + timedelta(days=shift_days)
        new_date_str = new_d.strftime("%Y-%m-%d")
    except Exception:
        new_date_str = original.scheduled_date

    new_item = ContentItem(
        title=f"{original.title} (Copy)",
        description=original.description,
        scheduled_date=new_date_str,
        scheduled_time=original.scheduled_time,
        status="Planned",
        platform=original.platform,
        content_type=original.content_type,
        language=original.language,
        script_id=original.script_id,
        script_version_id=original.script_version_id,
        hook_id=original.hook_id,
        video_analysis_id=original.video_analysis_id,
        content_pillar=original.content_pillar,
        content_goal=original.content_goal,
        priority=original.priority,
        tags=list(original.tags or []),
        notes=original.notes,
        cta=original.cta,
    )

    db.add(new_item)
    await db.flush()
    await db.refresh(new_item)

    refreshed = (await db.execute(select(ContentItem).where(ContentItem.id == new_item.id))).scalar_one()
    return build_content_item_response(refreshed)


@router.post(
    "/calendar/generate-plan",
    response_model=GenerateContentPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate AI Content Plan Suggestions",
    description="Synthesizes structured content plan suggestions based on Creator Persona Context, pillars, and desired posting frequency.",
)
async def generate_content_plan(
    payload: GenerateContentPlanRequest,
    db: AsyncSession = Depends(get_db),
) -> GenerateContentPlanResponse:
    # 1. Fetch Creator Profile to ground suggestions in real persona
    p_result = await db.execute(
        select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
    )
    profile = p_result.scalar_one_or_none()

    creator_name = (profile.creator_name if profile and profile.creator_name else "Creator")
    niche = (profile.niche if profile and profile.niche else "Filmmaking")
    pillars = (profile.content_pillars if profile and profile.content_pillars else ["Filmmaking Tips", "Behind the Scenes", "Equipment Breakdown"])
    language = (profile.primary_language if profile and profile.primary_language else "Tanglish")
    platforms = (profile.platforms if profile and profile.platforms else ["Instagram Reels", "YouTube Shorts"])
    primary_platform = platforms[0] if platforms else "Instagram Reels"
    cta_style = (profile.cta_style if profile and profile.cta_style else "Save this reel")
    duration = (profile.typical_duration if profile and profile.typical_duration else "45 sec")
    audience = (profile.target_audience if profile and profile.target_audience else "Aspiring filmmakers and creators")

    # 2. Determine target scheduled dates based on frequency & period
    start_d = (
        datetime.strptime(payload.start_date, "%Y-%m-%d").date()
        if payload.start_date
        else date.today() + timedelta(days=1)
    )

    freq = payload.posting_frequency
    period_days = payload.planning_period_days

    # Calculate post count and interval
    if freq == "1/week":
        count = max(1, period_days // 7)
        step = 7
    elif freq == "2/week":
        count = max(2, (period_days * 2) // 7)
        step = 3
    elif freq == "3/week":
        count = max(3, (period_days * 3) // 7)
        step = 2
    elif freq == "5/week":
        count = max(5, (period_days * 5) // 7)
        step = 1
    elif freq == "Daily":
        count = min(14, period_days)
        step = 1
    else:
        count = 3
        step = 2

    count = min(count, 14)  # Cap suggestions for high quality

    target_dates = [
        (start_d + timedelta(days=i * step)).strftime("%Y-%m-%d")
        for i in range(count)
    ]

    # 3. Attempt Gemini generation
    provider = get_llm_provider()
    suggestions: List[ContentPlanSuggestion] = []
    is_ai_generated = False

    if isinstance(provider, GeminiLLMProvider):
        try:
            prompt = (
                f"You are the expert content strategy architect for CINEHAI AI.\n"
                f"Generate a structured {period_days}-day short-form video publishing plan for:\n"
                f"- Creator: {creator_name}\n"
                f"- Niche: {niche}\n"
                f"- Core Pillars: {', '.join(pillars)}\n"
                f"- Target Audience: {audience}\n"
                f"- Primary Platform: {primary_platform}\n"
                f"- Language: {language}\n"
                f"- Preferred CTA: {cta_style}\n"
                f"- Preferred Duration: {duration}\n"
                f"- Target Dates: {', '.join(target_dates)}\n"
                f"- Post Count: {count}\n\n"
                f"RULES:\n"
                f"1. Evenly distribute topics across the creator's pillars ({', '.join(pillars)}).\n"
                f"2. Use varied content types (Educational, Storytelling, Behind the Scenes, Tutorial, Review, Transformation).\n"
                f"3. Return ONLY a valid JSON list of exactly {count} objects matching this JSON schema:\n"
                f"[\n"
                f"  {{\n"
                f'    "title": "Compelling short video title",\n'
                f'    "description": "2-sentence concept summary and visual angle",\n'
                f'    "suggested_date": "YYYY-MM-DD",\n'
                f'    "platform": "{primary_platform}",\n'
                f'    "content_type": "Educational | Storytelling | Tutorial | Behind the Scenes",\n'
                f'    "content_pillar": "One of the creator pillars",\n'
                f'    "language": "{language}",\n'
                f'    "suggested_duration": "{duration}",\n'
                f'    "cta": "{cta_style}",\n'
                f'    "rationale": "Why this topic hooks viewers and builds retention"\n'
                f"  }}\n"
                f"]"
            )
            raw = await provider._generate_content(prompt)
            clean = raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()
            data = json.loads(clean)

            if isinstance(data, list) and len(data) > 0:
                for idx, item_data in enumerate(data):
                    s_date = target_dates[idx] if idx < len(target_dates) else target_dates[-1]
                    s_pill = item_data.get("content_pillar") or pillars[idx % len(pillars)]
                    suggestions.append(
                        ContentPlanSuggestion(
                            title=item_data.get("title", f"{niche} Breakdown #{idx+1}"),
                            description=item_data.get("description", "Actionable short-form video concept."),
                            suggested_date=item_data.get("suggested_date", s_date),
                            platform=item_data.get("platform", primary_platform),
                            content_type=item_data.get("content_type", "Educational"),
                            content_pillar=s_pill,
                            language=item_data.get("language", language),
                            suggested_duration=item_data.get("suggested_duration", duration),
                            cta=item_data.get("cta", cta_style),
                            rationale=item_data.get("rationale", "Designed for maximum audience retention."),
                        )
                    )
                is_ai_generated = True
        except Exception as e:
            logger.warning(f"Gemini content plan generation failed or timed out: {e}. Falling back to deterministic plan engine.")
            suggestions = []

    # 4. Deterministic Fallback Engine if AI was unavailable or failed
    if not suggestions:
        content_types_cycle = [
            "Educational",
            "Tutorial",
            "Behind the Scenes",
            "Storytelling",
            "Review",
            "Transformation",
        ]
        topic_templates = [
            ("The #1 Mistake Creators Make in {pillar}", "Detailed breakdown of the most common error and the exact fix for cleaner results."),
            ("How to Level Up Your {pillar} Without Expensive Gear", "Budget-friendly techniques and smart hacks to achieve professional quality immediately."),
            ("Behind the Scenes: My Complete Workflow for {pillar}", "An authentic look behind the curtain showing the practical process from setup to final cut."),
            ("Stop Doing This in {pillar}: 3 Rules You Must Follow", "High-retention rule breakdown challenging outdated advice with real-world examples."),
            ("The Secret Tool That Transformed My {pillar}", "Deep dive into a specific tool, preset, or technique that delivers 10x improvement."),
            ("3 Quick {pillar} Hacks That Will Blow Your Mind", "Punchy, fast-paced carousel of actionable tips designed for quick saves and shares."),
        ]

        for i, target_date in enumerate(target_dates):
            pillar = pillars[i % len(pillars)]
            c_type = content_types_cycle[i % len(content_types_cycle)]
            title_tpl, desc_tpl = topic_templates[i % len(topic_templates)]
            title = title_tpl.format(pillar=pillar)
            description = desc_tpl.format(pillar=pillar)

            suggestions.append(
                ContentPlanSuggestion(
                    title=title,
                    description=description,
                    suggested_date=target_date,
                    platform=primary_platform,
                    content_type=c_type,
                    content_pillar=pillar,
                    language=language,
                    suggested_duration=duration,
                    cta=cta_style,
                    rationale=f"Addresses core viewer pain points in {pillar} using a proven {c_type.lower()} retention framework.",
                )
            )

    return GenerateContentPlanResponse(
        suggestions=suggestions,
        period_days=period_days,
        frequency=freq,
        is_ai_generated=is_ai_generated,
        summary_note=(
            f"Generated {len(suggestions)} content ideas tailored to your {niche} persona across {len(pillars)} core pillars."
            if is_ai_generated
            else f"Generated {len(suggestions)} structured plan concepts using deterministic persona matching across your core pillars."
        ),
    )
