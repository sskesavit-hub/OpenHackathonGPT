"""
Health check endpoints — server + Ollama status.
"""
from fastapi import APIRouter
from services.ollama_service import check_ollama_health, get_available_models, get_active_model

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", summary="Server and Ollama health check")
async def health_check():
    ollama = await check_ollama_health()
    models = get_available_models()
    return {
        "server": "online",
        "ollama": ollama,
        "active_model": get_active_model(),
        "models_loaded": len(models),
    }


@router.get("/ping", summary="Simple ping")
async def ping():
    return {"status": "pong"}
