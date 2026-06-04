"""
Ollama service — model discovery, health check, and dynamic model switching.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

from configs.settings import settings

logger = logging.getLogger(__name__)

# In-memory active model state
_active_model: str = settings.default_model
_available_models: List[Dict[str, Any]] = []


async def check_ollama_health() -> Dict[str, Any]:
    """Ping Ollama and return status info."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/version")
            resp.raise_for_status()
            data = resp.json()
            return {"status": "online", "version": data.get("version", "unknown")}
    except Exception as exc:
        logger.warning("Ollama health check failed: %s", exc)
        return {"status": "offline", "version": None, "error": str(exc)}


async def scan_models() -> List[Dict[str, Any]]:
    """
    Query Ollama /api/tags and return a normalized list of installed models.
    Also updates the module-level cache and auto-selects the first model if needed.
    """
    global _available_models, _active_model
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            resp.raise_for_status()
            data = resp.json()

        models = []
        for m in data.get("models", []):
            details = m.get("details", {})
            models.append(
                {
                    "name": m.get("name", ""),
                    "size_gb": round(m.get("size", 0) / 1e9, 2),
                    "family": details.get("family", "unknown"),
                    "parameter_size": details.get("parameter_size", ""),
                    "quantization": details.get("quantization_level", ""),
                    "modified_at": m.get("modified_at", ""),
                }
            )

        _available_models = models

        # Auto-select model
        if models and not _active_model:
            _active_model = models[0]["name"]
            logger.info("Auto-selected model: %s", _active_model)

        return models
    except Exception as exc:
        logger.error("Failed to scan Ollama models: %s", exc)
        return []


def get_available_models() -> List[Dict[str, Any]]:
    """Return cached model list."""
    return _available_models


def get_active_model() -> str:
    """Return the currently active model name."""
    return _active_model


def set_active_model(model_name: str) -> bool:
    """
    Switch to a different model. Returns True if successful.
    The model must be in the available models list.
    """
    global _active_model
    available_names = [m["name"] for m in _available_models]
    if model_name not in available_names:
        logger.warning("Model '%s' not in available models list", model_name)
        return False
    _active_model = model_name
    logger.info("Active model switched to: %s", model_name)
    return True


def get_model_info(model_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Return metadata for a specific model (defaults to active model)."""
    name = model_name or _active_model
    for m in _available_models:
        if m["name"] == name:
            return m
    return None
