"""
OpenHackathonGPT — Application Settings
Uses Pydantic BaseSettings to load from .env file
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)
    app_env: str = Field(default="development")
    secret_key: str = Field(default="change-me-to-a-random-secret")

    # LLM Settings
    llm_provider: str = Field(default="ollama")
    llm_api_key: str = Field(default="")
    ollama_base_url: str = Field(default="http://localhost:11434")
    default_model: str = Field(default="")

    # Database
    database_url: str = Field(default=f"sqlite+aiosqlite:///{BASE_DIR}/data/hackathon.db")

    # Logging
    log_level: str = Field(default="INFO")

    # Search
    search_provider: str = Field(default="duckduckgo")
    tavily_api_key: str = Field(default="")
    serpapi_api_key: str = Field(default="")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=30)

    # Cache
    search_cache_ttl: int = Field(default=3600)

    # CORS
    cors_origins: str = Field(default="*")

    # Agents
    agent_timeout: int = Field(default=120)

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        v = v.upper()
        if v not in allowed:
            return "INFO"
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def db_path(self) -> Path:
        """Resolved path to the SQLite database file."""
        path = BASE_DIR / "data" / "hackathon.db"
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def logs_dir(self) -> Path:
        logs = BASE_DIR / "logs"
        logs.mkdir(parents=True, exist_ok=True)
        return logs


def load_default_config() -> dict:
    config_path = BASE_DIR / "configs" / "default_config.json"
    if config_path.exists():
        return json.loads(config_path.read_text(encoding="utf-8"))
    return {}


# Singleton
settings = Settings()
