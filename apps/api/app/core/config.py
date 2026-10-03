import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "CINEHA AI API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./cineha_ai.db"
    
    # Video Processing Limits (Centralized 100MB limit)
    MAX_VIDEO_SIZE_MB: int = Field(default=100, description="Maximum video upload size in Megabytes")
    
    # AI Providers
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = Field(
        default="gemini-3.5-flash-lite",
        description="Google Gemini model identifier for text generation and analysis",
    )
    OPENAI_API_KEY: str = ""

    # Caption Studio & Speech Transcription Providers
    TRANSCRIPTION_PROVIDER: str = Field(
        default="local_whisper",
        description="Transcription provider: 'local_whisper' (default, free on-device STT), 'production' (OpenAI Whisper cloud API), or 'mock' (unit tests only)",
    )
    LOCAL_WHISPER_MODEL: str = Field(
        default="base",
        description="Local Whisper model size (tiny, base, small, medium, large-v3)",
    )
    WHISPER_API_KEY: str = Field(
        default="",
        description="Dedicated API key for Whisper speech-to-text (falls back to OPENAI_API_KEY if unset)",
    )
    WHISPER_MODEL: str = Field(
        default="whisper-1",
        description="Speech recognition model identifier",
    )
    WHISPER_API_URL: str = Field(
        default="https://api.openai.com/v1/audio/transcriptions",
        description="HTTP endpoint for speech transcription API",
    )
    FFMPEG_PATH: str = Field(
        default="",
        description="Optional custom path to ffmpeg binary (auto-detected if unset)",
    )
    ENABLE_HYBRID_SPEECH_RESTORATION: bool = Field(
        default=True,
        description="Enable Gemini-powered Telugu/Tanglish speech restoration on top of local Whisper transcription",
    )

    # Caption Studio Language Processing (Translation & Transliteration)
    LANGUAGE_PROCESSOR_PROVIDER: str = Field(
        default="mock",
        description="Language processor provider: 'mock' or 'production'",
    )
    LANGUAGE_PROCESSOR_API_KEY: str = Field(
        default="",
        description="Dedicated API key for language translation/transliteration (falls back to OPENAI_API_KEY)",
    )
    LANGUAGE_PROCESSOR_MODEL: str = Field(
        default="gpt-4o-mini",
        description="LLM model identifier for language translation and transliteration",
    )

    # Caption Studio Rendering & Unicode Fonts
    TELUGU_FONT_PATH: str = Field(
        default="",
        description="Optional path to custom Telugu Unicode font file or directory",
    )
    RENDER_CACHE_DIR: str = Field(
        default="",
        description="Optional directory for rendered MP4 outputs (defaults to system temp)",
    )

    @property
    def cors_origins(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()
