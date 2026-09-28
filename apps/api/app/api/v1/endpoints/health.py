from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.schemas.health import HealthResponse

router = APIRouter()

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="API Health Check",
    description="Returns API status, database connectivity, and configuration parameters.",
)
async def check_health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    # Verify database connectivity
    db_status = "connected"
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
    except Exception as e:
        db_status = f"error: {str(e)}"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=db_status,
        active_provider=settings.AI_PROVIDER,
        max_video_size_mb=settings.MAX_VIDEO_SIZE_MB,
        timestamp=datetime.now(timezone.utc),
    )
