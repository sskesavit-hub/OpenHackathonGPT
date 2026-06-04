@echo off
echo ==========================================
echo   OpenHackathonGPT - Starting Server
echo ==========================================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.11+
    pause
    exit /b 1
)

:: Create venv if not exists
if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install dependencies if needed
if not exist "venv\Lib\site-packages\fastapi" (
    echo [INFO] Installing dependencies...
    pip install -r requirements.txt
)

:: Copy .env if not exists
if not exist ".env" (
    echo [INFO] Creating .env from template...
    copy .env.example .env
    echo [WARNING] Please review .env settings before continuing.
)

:: Check Ollama
echo [INFO] Checking Ollama...
curl -s http://localhost:11434/api/version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ollama not running. Start Ollama first: ollama serve
    echo           Continuing anyway - you can start Ollama later.
)

:: Start server
echo [INFO] Starting OpenHackathonGPT on http://localhost:8000
echo [INFO] Press Ctrl+C to stop
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-dir . --reload-exclude venv --reload-exclude data --reload-exclude logs --reload-exclude scratch --reload-exclude __pycache__

pause
