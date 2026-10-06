from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Create async engine with appropriate parameters
engine_kwargs = {"echo": False}
if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def sync_sqlite_schema(sync_conn) -> None:
    """Ensure newly added columns exist in existing SQLite tables without requiring manual migrations."""
    from sqlalchemy import inspect, text
    inspector = inspect(sync_conn)
    if "creator_profiles" in inspector.get_table_names():
        existing_cols = {col["name"] for col in inspector.get_columns("creator_profiles")}
        new_columns = [
            ("display_name", "VARCHAR(100)"),
            ("creator_type", "VARCHAR(50) DEFAULT 'Filmmaker'"),
            ("location", "VARCHAR(100)"),
            ("secondary_niches", "JSON DEFAULT '[]'"),
            ("content_pillars", "JSON DEFAULT '[]'"),
            ("topics_to_avoid", "JSON DEFAULT '[]'"),
            ("target_audience_age", "VARCHAR(50)"),
            ("audience_interests", "JSON DEFAULT '[]'"),
            ("audience_pain_points", "JSON DEFAULT '[]'"),
            ("audience_sophistication", "VARCHAR(50)"),
            ("energy", "VARCHAR(50)"),
            ("humor", "VARCHAR(50)"),
            ("storytelling_style", "VARCHAR(50)"),
            ("vocabulary", "VARCHAR(50)"),
            ("custom_tone_notes", "TEXT"),
            ("secondary_languages", "JSON DEFAULT '[]'"),
            ("script_preference", "VARCHAR(50)"),
            ("preferred_aspect_ratio", "VARCHAR(20)"),
            ("typical_duration", "VARCHAR(50)"),
            ("cta_style", "VARCHAR(50)"),
            ("secondary_cta_styles", "JSON DEFAULT '[]'"),
            ("brand_positioning", "TEXT"),
            ("core_message", "TEXT"),
            ("words_to_use", "JSON DEFAULT '[]'"),
            ("words_to_avoid", "JSON DEFAULT '[]'"),
            ("style_rules", "JSON DEFAULT '[]'"),
            ("liked_examples", "JSON DEFAULT '[]'"),
            ("disliked_examples", "JSON DEFAULT '[]'"),
        ]
        for col_name, col_type in new_columns:
            if col_name not in existing_cols:
                sync_conn.execute(text(f"ALTER TABLE creator_profiles ADD COLUMN {col_name} {col_type}"))

    if "content_items" in inspector.get_table_names():
        existing_ci_cols = {col["name"] for col in inspector.get_columns("content_items")}
        new_ci_cols = [
            ("script_version_id", "VARCHAR(36)"),
            ("hook_id", "VARCHAR(100)"),
            ("video_analysis_id", "VARCHAR(36)"),
            ("content_pillar", "VARCHAR(100)"),
            ("content_goal", "VARCHAR(100)"),
            ("priority", "VARCHAR(20) DEFAULT 'Medium'"),
            ("tags", "JSON DEFAULT '[]'"),
            ("notes", "TEXT"),
            ("cta", "VARCHAR(255)"),
        ]
        for col_name, col_type in new_ci_cols:
            if col_name not in existing_ci_cols:
                sync_conn.execute(text(f"ALTER TABLE content_items ADD COLUMN {col_name} {col_type}"))

    if "scripts" in inspector.get_table_names():
        existing_script_cols = {col["name"] for col in inspector.get_columns("scripts")}
        new_script_cols = [
            ("source_type", "VARCHAR(50) DEFAULT 'scratch'"),
            ("source_url", "VARCHAR(500)"),
            ("source_platform", "VARCHAR(50)"),
            ("original_video_title", "VARCHAR(255)"),
            ("extraction_method", "VARCHAR(50)"),
        ]
        for col_name, col_type in new_script_cols:
            if col_name not in existing_script_cols:
                sync_conn.execute(text(f"ALTER TABLE scripts ADD COLUMN {col_name} {col_type}"))

async def init_db() -> None:
    """Initialize database tables and synchronize column additions."""
    import app.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(sync_sqlite_schema)

