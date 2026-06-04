#!/bin/bash
# OpenHackathonGPT — Linux/macOS Startup Script

set -e

echo "=========================================="
echo "  OpenHackathonGPT - Starting Server"
echo "=========================================="

# Check Python 3.11+
if ! command -v python3 &>/dev/null; then
    echo "[ERROR] Python 3 not found. Install Python 3.11+"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "[INFO] Python $PYTHON_VERSION detected"

# Create venv
if [ ! -d "venv" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install deps
if ! python -c "import fastapi" 2>/dev/null; then
    echo "[INFO] Installing dependencies..."
    pip install -r requirements.txt
fi

# Create .env
if [ ! -f ".env" ]; then
    echo "[INFO] Creating .env from template..."
    cp .env.example .env
    echo "[WARNING] Review .env settings!"
fi

# Check Ollama
if ! curl -sf http://localhost:11434/api/version >/dev/null; then
    echo "[WARNING] Ollama not running. Start with: ollama serve"
fi

# Start
echo "[INFO] Starting on http://localhost:8000"
echo "[INFO] Press Ctrl+C to stop"
echo ""
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-dir . --reload-exclude venv --reload-exclude data --reload-exclude logs --reload-exclude scratch --reload-exclude __pycache__
