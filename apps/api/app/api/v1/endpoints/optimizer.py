from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.script import ScriptResponse
from app.schemas.optimizer import (
    ScriptOptimizationRequest,
    ScriptOptimizationResponse,
    SaveOptimizedScriptRequest,
)
from app.agents.script_optimizer_agent import get_script_optimizer_agent, ScriptOptimizerAgent

router = APIRouter()


@router.post(
    "/optimizer/custom",
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
    "/optimizer/script/{script_id}",
    response_model=ScriptOptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Optimize Script by ID",
    description="Loads a saved script, analyzes before/after retention, and generates an optimized screenplay according to chosen goals.",
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
    "/optimizer/script/{script_id}/save",
    response_model=ScriptResponse,
    status_code=status.HTTP_200_OK,
    summary="Save Optimized Script Version",
    description="Saves the optimized screenplay as a new immutable ScriptVersion in the database, preserving all previous versions.",
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
