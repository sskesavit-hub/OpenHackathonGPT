# OpenHackathonGPT

> A fully **local**, **multi-agent** AI Hackathon Assistant powered by **Ollama** and **LangGraph**

[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-purple)](https://langchain-ai.github.io/langgraph)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-orange)](https://ollama.com)

---

## Features

- **7 Specialized AI Agents** — Supervisor, Problem Discovery, Research, Innovation, Architecture, PPT, Judge Prep
- **Advanced Web Search & Scraping** — Supports Crawl4AI, DuckDuckGo, and Wikipedia API for live data gathering
- **RAG Document Upload** — Upload custom context files directly into the chat for agents to reference
- **Streaming Chat** — Real-time WebSocket streaming with instantaneous "Stop Generating" control
- **Dynamic Model Switching** — Auto-detects all Ollama models, switch without restart
- **Dark/Light Mode** — Premium glassmorphism UI with SVG micro-animations
- **Fully Responsive** — Works on mobile, tablet, and desktop
- **Persistent History** — SQLite stores all sessions, chat logs, and settings
- **Plugin-Ready** — Extensible architecture for future agents

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.115, Python 3.11+ |
| AI Agents | LangGraph 0.2, LangChain 0.3 |
| LLM | Ollama (local) |
| Database | SQLite + aiosqlite |
| Search / Scrape | Crawl4AI, DuckDuckGo, Wikipedia API |
| Security | slowapi (Rate Limiting) |
| Frontend | HTML5, CSS3, Vanilla JS |

---

## Quick Start

### Prerequisites

1. **Python 3.11+** installed
2. **Ollama** installed and running: [ollama.com](https://ollama.com)
3. At least one model pulled:
   ```bash
   ollama pull llama3
   # or
   ollama pull mistral
   # or
   ollama pull gemma3
   ```

### Installation

```bash
# 1. Clone/navigate to project
git clone https://github.com/sskesavit-hub/OpenHackathonGPT.git
cd OpenHackathonGPT

# 2. Windows — run start.bat
start.bat

# 2. Linux/macOS — run start.sh
chmod +x start.sh && ./start.sh

# OR manual setup:
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Linux/macOS
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### 3. Open Browser
Navigate to **http://localhost:8000** 

---

## Agent Pipeline

```
User Input
    |
Supervisor Agent        — Understands intent, orchestrates workflow
    |
Problem Discovery       — Generates problem statements & pain points
    |
Research Agent          — Searches web, GitHub, ArXiv using Crawl4AI/DuckDuckGo
    |
Innovation Agent        — Gap analysis, innovation scoring (0-100)
    |
Architecture Agent      — System design, tech stack, API schema
    |
PPT Agent               — 10-slide pitch deck content
    |
Judge Prep Agent         — 15 Q&A answers for judges
    |
Final Report
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server + Ollama status |
| GET | `/api/models` | List Ollama models |
| POST | `/api/models/select` | Switch active model |
| POST | `/api/chat/sessions` | Create chat session |
| GET | `/api/chat/sessions` | List all sessions |
| POST | `/api/chat/send` | Send message (REST) |
| WS | `/api/chat/ws/{id}` | Streaming WebSocket |
| POST | `/api/agents/run` | Run full pipeline |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

**Swagger UI**: http://localhost:8000/api/docs

---

## Troubleshooting

### ModuleNotFoundError: No module named 'slowapi'
If you copy the project to a new folder on Windows, the virtual environment paths will break. Do not copy the `venv` folder. Instead, delete it and recreate it:
```bash
rmdir /S /Q venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

---

## Configuration

Copy `.env.example` to `.env` and configure:

```env
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3
SEARCH_PROVIDER=crawl4ai
LOG_LEVEL=INFO
```

---

## Future Plugins

| Plugin | Technology |
|--------|-----------|
| Voice Agent | Whisper + Kokoro TTS / XTTS |
| OCR Agent | Tesseract / PaddleOCR |
| PPT Export | python-pptx |
| PDF Export | ReportLab |

---

## License

MIT License — free to use, modify, and distribute.

---

Made with Ollama, LangGraph, FastAPI, and Vanilla JS
