from fastapi import APIRouter
from app.api.v1.endpoints import health, profile, hooks, scripts

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(profile.router, tags=["Creator Profile"])
api_router.include_router(hooks.router, tags=["Hook Generator"])
api_router.include_router(scripts.router, tags=["Script Studio"])

