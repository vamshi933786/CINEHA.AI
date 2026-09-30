from fastapi import APIRouter
from app.api.v1.endpoints import health, profile, hooks, scripts, analyzer, optimizer, captions

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(profile.router, tags=["Creator Profile"])
api_router.include_router(hooks.router, tags=["Hook Generator"])
api_router.include_router(scripts.router, tags=["Script Studio"])
api_router.include_router(analyzer.router, tags=["Retention Analyzer"])
api_router.include_router(optimizer.router, tags=["Script Optimizer"])
api_router.include_router(captions.router, tags=["Caption Studio"])

