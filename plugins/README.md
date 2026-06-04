# OpenHackathonGPT — Plugin System

This directory is reserved for future plugin extensions.

## How Plugins Work

Each plugin is a Python module placed in this directory. Plugins are **auto-discovered** on startup
if they implement the `HackathonPlugin` interface.

## Plugin Interface

```python
from plugins.base import HackathonPlugin

class MyPlugin(HackathonPlugin):
    name = "my_plugin"
    description = "Does something amazing"
    version = "1.0.0"

    def register_routes(self, app: FastAPI) -> None:
        """Register FastAPI routes."""
        ...

    async def on_agent_complete(self, agent_name: str, state: dict) -> None:
        """Hook called after each agent completes."""
        ...
```

## Planned Plugins

| Plugin | Status | Description |
|--------|--------|-------------|
| `voice_agent` | 🔜 Planned | Whisper STT + Kokoro TTS voice interface |
| `rag_agent` | 🔜 Planned | ChromaDB RAG for custom knowledge bases |
| `ocr_agent` | 🔜 Planned | Tesseract/PaddleOCR for image/PDF analysis |
| `github_agent` | 🔜 Planned | Deep GitHub repository analysis |
| `ppt_export` | 🔜 Planned | Export pitch deck as `.pptx` file |
| `pdf_export` | 🔜 Planned | Export full report as `.pdf` |

## Installing a Plugin

```bash
# Copy plugin to plugins directory
cp my_plugin.py plugins/

# Restart server (plugins auto-discovered)
uvicorn main:app --reload
```
