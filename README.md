# OpenHackathonGPT 🚀

> A fully **local**, **multi-agent** AI Hackathon Assistant powered by **Ollama** and **LangGraph**

[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-purple)](https://langchain-ai.github.io/langgraph)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-orange)](https://ollama.com)

---

## ✨ Features

- 🤖 **7 Specialized AI Agents** — Supervisor, Problem Discovery, Research, Innovation, Architecture, PPT, Judge Prep
- 🔍 **Live Web Search** — DuckDuckGo, GitHub repositories, ArXiv papers
- 💬 **Streaming Chat** — Real-time WebSocket streaming with typing animations
- 🧩 **Dynamic Model Switching** — Auto-detects all Ollama models, switch without restart
- 🌙 **Dark/Light Mode** — Premium glassmorphism UI
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop
- 💾 **Persistent History** — SQLite stores all sessions and settings
- 🔌 **Plugin-Ready** — Extensible architecture for future agents

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.115, Python 3.11+ |
| AI Agents | LangGraph 0.2, LangChain 0.3 |
| LLM | Ollama (local) |
| Database | SQLite + aiosqlite |
| Search | DuckDuckGo, GitHub API, ArXiv |
| Frontend | HTML5, CSS3, Vanilla JS |

---

## 🚀 Quick Start

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
cd "d:\ai program\Multiagent"

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
Navigate to **http://localhost:8000** 🎉

---

## 🤖 Agent Pipeline

```
User Input
    ↓
🧠 Supervisor Agent        — Understands intent, orchestrates workflow
    ↓
🔍 Problem Discovery       — Generates problem statements & pain points
    ↓
📡 Research Agent          — Searches web, GitHub, ArXiv
    ↓
💡 Innovation Agent        — Gap analysis, innovation scoring (0-100)
    ↓
🏗️ Architecture Agent      — System design, tech stack, API schema
    ↓
📊 PPT Agent               — 10-slide pitch deck content
    ↓
❓ Judge Prep Agent         — 15 Q&A answers for judges
    ↓
📋 Final Report
```

---

## 📡 API Endpoints

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

## 📁 Project Structure

```
Multiagent/
├── main.py                     # FastAPI app entry point
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
│
├── configs/
│   ├── settings.py             # Pydantic settings / env loading
│   └── default_config.json     # Default app config
│
├── logs/                       # Auto-created at runtime
│
├── database/
│   ├── db.py                   # SQLite async connection (aiosqlite)
│   ├── models.py               # Table schemas
│   └── crud.py                 # CRUD operations
│
├── agents/
│   ├── __init__.py
│   ├── supervisor.py           # LangGraph supervisor / orchestrator
│   ├── problem_discovery.py
│   ├── research.py
│   ├── innovation.py
│   ├── architecture.py
│   ├── ppt.py
│   └── judge_prep.py
│
├── graph/
│   ├── __init__.py
│   └── workflow.py             # LangGraph StateGraph definition
│
├── api/
│   ├── __init__.py
│   ├── chat.py                 # Chat REST + WebSocket endpoints
│   ├── models.py               # /models endpoints (Ollama scan)
│   ├── agents.py               # Agent run/status endpoints
│   ├── settings.py             # Settings CRUD endpoints
│   └── health.py               # Health/status endpoints
│
├── services/
│   ├── ollama_service.py       # Ollama HTTP client + model scanning
│   ├── search_service.py       # Web/GitHub/paper search
│   └── cache_service.py        # Search result caching in SQLite
│
├── plugins/                    # Plugin-ready folder (empty stubs)
│   └── README.md
│
├── static/
│   ├── index.html              # Single Page App shell
│   ├── css/
│   │   ├── main.css            # Design system + dark/light mode
│   │   ├── sidebar.css
│   │   ├── chat.css
│   │   └── dashboard.css
│   └── js/
│       ├── app.js              # Router + state management
│       ├── api.js              # API client (fetch + WebSocket)
│       ├── components/
│       │   ├── sidebar.js
│       │   ├── chat.js
│       │   ├── modelSelector.js
│       │   ├── agentPanel.js
│       │   ├── settings.js
│       │   └── statusBar.js
│       └── pages/
│           ├── home.js
│           ├── chatPage.js
│           ├── agentsPage.js
│           └── settingsPage.js

```

---

## 🔧 Configuration

Copy `.env.example` to `.env` and configure:

```env
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3
SEARCH_PROVIDER=duckduckgo
LOG_LEVEL=INFO
```

---

## 🔌 Future Plugins

| Plugin | Technology |
|--------|-----------|
| Voice Agent | Whisper + Kokoro TTS / XTTS |
| RAG Agent | ChromaDB |
| OCR Agent | Tesseract / PaddleOCR |
| File Support | PDF, DOCX, PPTX, CSV |
| PPT Export | python-pptx |
| PDF Export | ReportLab |

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

Made with ❤️ using Ollama, LangGraph, FastAPI, and Vanilla JS
