"""
Model management API endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.ollama_service import (
    scan_models,
    get_available_models,
    get_active_model,
    set_active_model,
    get_model_info,
)
from database.crud import set_setting, get_setting
from configs.settings import settings

router = APIRouter(prefix="/api/models", tags=["models"])


class ModelSelectRequest(BaseModel):
    model_name: str


@router.get("", summary="List available models for active provider")
async def list_models():
    """Return models based on current provider."""
    provider = await get_setting("llm_provider", default=settings.llm_provider)
    active_model = await get_setting("active_model", default=get_active_model())
    
    if provider == "openai":
        models = [{"name": "gpt-4o"}, {"name": "gpt-4o-mini"}, {"name": "gpt-3.5-turbo"}, {"name": "o1-mini"}, {"name": "o1-preview"}]
        return {"models": models, "active": active_model, "count": len(models)}
    elif provider == "anthropic":
        models = [{"name": "claude-3-5-sonnet-latest"}, {"name": "claude-3-haiku-20240307"}, {"name": "claude-3-opus-20240229"}]
        return {"models": models, "active": active_model, "count": len(models)}
    elif provider == "groq":
        models = [{"name": "llama3-8b-8192"}, {"name": "llama3-70b-8192"}, {"name": "mixtral-8x7b-32768"}, {"name": "gemma2-9b-it"}]
        return {"models": models, "active": active_model, "count": len(models)}
    elif provider == "gemini":
        models = [{"name": "gemini-2.0-flash"}, {"name": "gemini-1.5-pro"}]
        return {"models": models, "active": active_model, "count": len(models)}
    else:
        # Default to Ollama
        models = await scan_models()
        return {
            "models": models,
            "active": active_model or get_active_model(),
            "count": len(models),
        }


@router.get("/active", summary="Get currently active model")
async def get_active():
    provider = await get_setting("llm_provider", default=settings.llm_provider)
    model_name = await get_setting("active_model", default=get_active_model() if provider == "ollama" else "")
    info = get_model_info(model_name) if provider == "ollama" else {"name": model_name}
    return {"active_model": model_name, "info": info}


@router.post("/select", summary="Switch active model")
async def select_model(req: ModelSelectRequest):
    """Dynamically switch the active model."""
    provider = await get_setting("llm_provider", default=settings.llm_provider)
    
    if provider == "ollama":
        await scan_models()
        success = set_active_model(req.model_name)
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Model '{req.model_name}' not found in Ollama available models.",
            )
        info = get_model_info(req.model_name)
    else:
        # For external providers, just accept the string
        info = {"name": req.model_name}

    # Persist selection
    await set_setting("active_model", req.model_name)
    return {
        "message": f"Switched to model: {req.model_name}",
        "active_model": req.model_name,
        "info": info,
    }


@router.post("/refresh", summary="Refresh available model list")
async def refresh_models():
    """Re-scan Ollama for newly pulled models."""
    models = await scan_models()
    return {
        "message": "Model list refreshed",
        "models": models,
        "count": len(models),
    }
