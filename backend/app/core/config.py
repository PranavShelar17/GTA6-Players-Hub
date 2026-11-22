import json
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "GTA 6 Player Hub API"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "development_secret_key_minimum_32_characters_long_for_security"
    API_V1_STR: str = "/api/v1"

    # CORS origins allowed to communicate with this backend
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ]

    # Database URLs
    # Async URL for FastAPI asyncpg / SQLite fallback
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgrespassword@localhost:5435/gta6playerhub"
    # Sync URL for Alembic migrations
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgrespassword@localhost:5435/gta6playerhub"
    REDIS_URL: str = "redis://localhost:6381/0"

    # Supabase Integration (Server-side)
    SUPABASE_URL: str = "https://your-project-ref.supabase.co"
    SUPABASE_ANON_KEY: str = "your-supabase-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: str = "your-supabase-jwt-secret-min-32-chars-for-dev"
    SUPABASE_STORAGE_BUCKET: str = "avatars"

    # AI Gaming Problem Solver Configuration (Phase 9)
    # Provider-independent configuration: supports "mock", "openai", "gemini", "custom"
    AI_PROVIDER: str = "mock"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gpt-4o-mini"
    AI_API_BASE_URL: Optional[str] = None
    AI_MAX_TOKENS: int = 1500
    AI_TEMPERATURE: float = 0.5
    AI_SYSTEM_NAME: str = "Vice City AI Technical Assistant"

    # Fallback to in-memory SQLite if PostgreSQL is unavailable in local dev/tests
    SQLITE_FALLBACK: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
