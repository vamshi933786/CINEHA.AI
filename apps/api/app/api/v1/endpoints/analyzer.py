from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.analyzer import ScriptAnalysisRequest, ScriptAnalysisResponse
from app.agents.retention_analyzer_agent import get_retention_analyzer_agent, RetentionAnalyzerAgent

router = APIRouter()


@router.post(
    "/analyzer/script",
    response_model=ScriptAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Script Retention",
    description="Performs multi-dimensional retention audit across 9 psychological short-form criteria.",
)
async def analyze_script(
    payload: ScriptAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    agent: RetentionAnalyzerAgent = Depends(get_retention_analyzer_agent),
) -> ScriptAnalysisResponse:
    return await agent.analyze(request=payload, db=db)


@router.get(
    "/analyzer/script/{script_id}",
    response_model=ScriptAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Saved Script by ID",
    description="Loads a saved script from the database and runs the full 9-dimension retention diagnostic.",
)
async def analyze_script_by_id(
    script_id: str,
    db: AsyncSession = Depends(get_db),
    agent: RetentionAnalyzerAgent = Depends(get_retention_analyzer_agent),
) -> ScriptAnalysisResponse:
    return await agent.analyze(
        request=ScriptAnalysisRequest(script_id=script_id),
        db=db,
    )
