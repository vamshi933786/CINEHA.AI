from datetime import datetime
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Overall health status")
    project_name: str = Field(..., description="Application name")
    version: str = Field(..., description="API semantic version")
    environment: str = Field(..., description="Current running environment")
    database: str = Field(..., description="Database connection status: 'connected' or 'error'")
    active_provider: str = Field(..., description="Configured active AI provider")
    max_video_size_mb: int = Field(..., description="Configured maximum video upload limit in MB")
    timestamp: datetime = Field(..., description="Current server UTC timestamp")

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "project_name": "CINEHA AI API",
                "version": "1.0.0",
                "environment": "development",
                "database": "connected",
                "active_provider": "heuristic_mock",
                "max_video_size_mb": 100,
                "timestamp": "2026-09-28T12:00:00Z"
            }
        }
    }
