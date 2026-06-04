"""
OpenHackathonGPT — FastAPI Application Entry Point
"""
from __future__ import annotations

import logging
import logging.config
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from configs.settings import settings
from database.db import init_db
from services.ollama_service import scan_models, get_active_model
from database.crud import get_setting, set_setting

# ─── Logging Setup ───────────────────────────────────────────────────────────

def setup_logging():
    logs_dir = settings.logs_dir
    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json": {
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "level": settings.log_level,
                "stream": "ext://sys.stdout",
            },
            "app_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(logs_dir / "app.log"),
                "maxBytes": 10 * 1024 * 1024,  # 10MB
                "backupCount": 5,
                "formatter": "standard",
                "level": settings.log_level,
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(logs_dir / "error.log"),
                "maxBytes": 10 * 1024 * 1024,
                "backupCount": 3,
                "formatter": "json",
                "level": "ERROR",
            },
        },
        "root": {
            "level": settings.log_level,
            "handlers": ["console", "app_file"],
        },
        "loggers": {
            "uvicorn.error": {"level": "INFO"},
            "uvicorn.access": {"level": "WARNING"},
        },
    })


setup_logging()
logger = logging.getLogger(__name__)

# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("[startup] OpenHackathonGPT starting up...")

    # Initialize database
    await init_db()
    logger.info("[startup] Database initialized")

    # Scan Ollama models
    models = await scan_models()
    logger.info("[startup] Found %d Ollama models", len(models))
    if not models:
        logger.warning("[startup] No Ollama models found. Is Ollama running at %s?", settings.ollama_base_url)

    # Restore persisted model selection
    persisted_model = await get_setting("active_model", "")
    if persisted_model:
        from services.ollama_service import set_active_model
        set_active_model(persisted_model)
        logger.info("[startup] Restored active model: %s", persisted_model)

    # Purge expired cache
    from services.cache_service import purge_expired
    purged = await purge_expired()
    if purged:
        logger.info("[startup] Purged %d expired cache entries", purged)

    logger.info("[startup] OpenHackathonGPT ready at http://%s:%d", settings.app_host, settings.app_port)
    yield

    logger.info("[shutdown] OpenHackathonGPT shutting down...")


# ─── App Factory ─────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="OpenHackathonGPT",
        description="A fully local, multi-agent AI Hackathon Assistant",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate Limiting
    limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Request logging middleware & Cache-Busting
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.debug("→ %s %s", request.method, request.url.path)
        response = await call_next(request)
        logger.debug("← %s %s %d", request.method, request.url.path, response.status_code)
        
        # Disable caching to ensure frontend updates are fetched
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    # Routers
    from fastapi import Depends
    from api.dependencies import verify_api_key
    from api.health import router as health_router
    from api.models import router as models_router
    from api.chat import router as chat_router
    from api.agents import router as agents_router
    from api.settings import router as settings_router

    # Health remains unprotected so load-balancers/frontend can check status
    app.include_router(health_router)
    
    # Protect other routes
    from api.rag import router as rag_router

    app.include_router(models_router, dependencies=[Depends(verify_api_key)])
    app.include_router(chat_router, dependencies=[Depends(verify_api_key)])
    app.include_router(agents_router, dependencies=[Depends(verify_api_key)])
    app.include_router(settings_router, dependencies=[Depends(verify_api_key)])
    app.include_router(rag_router)


    # Static Files & SPA
    static_dir = Path(__file__).parent / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

        @app.get("/", include_in_schema=False)
        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str = ""):
            """Serve the SPA index.html for all non-API routes."""
            index = static_dir / "index.html"
            if index.exists():
                return FileResponse(str(index))
            return {"error": "Frontend not found"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "development",
        log_level=settings.log_level.lower(),
    )
