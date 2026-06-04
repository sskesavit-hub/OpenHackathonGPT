"""
Chat API — REST and WebSocket endpoints.
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

import aiosqlite
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from database.crud import (
    create_session,
    get_session,
    list_sessions,
    delete_session,
    add_message,
    get_messages,
    update_session_title,
)
from graph.workflow import stream_pipeline
from services.llm_service import get_llm
from services.ollama_service import get_active_model
from configs.settings import settings
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


async def _ensure_session(session_id: str) -> None:
    """Ensure a session with the given ID exists in the database."""
    now = datetime.now(timezone.utc).isoformat()
    model = get_active_model()
    async with aiosqlite.connect(str(settings.db_path)) as db:
        await db.execute(
            "INSERT OR IGNORE INTO chat_sessions (id, title, model, created_at, updated_at) VALUES (?,?,?,?,?)",
            (session_id, "New Chat", model, now, now),
        )
        await db.commit()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    use_agents: bool = False


class TitleUpdateRequest(BaseModel):
    title: str


# ─── REST Endpoints ──────────────────────────────────────────────────────────

@router.get("/sessions", summary="List all chat sessions")
async def list_chat_sessions(limit: int = 50, offset: int = 0):
    sessions = await list_sessions(limit=limit, offset=offset)
    return {"sessions": sessions, "count": len(sessions)}


@router.post("/sessions", summary="Create a new chat session")
async def create_chat_session(title: str = "New Chat"):
    model = get_active_model()
    session = await create_session(model=model, title=title)
    return session


@router.get("/sessions/{session_id}", summary="Get session messages")
async def get_session_messages(session_id: str):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = await get_messages(session_id)
    return {"session": session, "messages": messages}


@router.put("/sessions/{session_id}/title", summary="Update session title")
async def update_title(session_id: str, req: TitleUpdateRequest):
    await update_session_title(session_id, req.title)
    return {"message": "Title updated"}


@router.delete("/sessions/{session_id}", summary="Delete a chat session")
async def delete_chat_session(session_id: str):
    deleted = await delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}


@router.post("/send", summary="Send a single chat message (REST)")
async def send_message(req: ChatRequest):
    """Simple REST chat — direct LLM response without full agent pipeline."""
    # Get or create session
    if req.session_id:
        session = await get_session(req.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        session_id = req.session_id
    else:
        model = get_active_model()
        session_data = await create_session(model=model)
        session_id = session_data["id"]

    # Save user message
    await add_message(session_id, "user", req.message)

    try:
        model = get_active_model()
        llm = ChatOllama(model=model, temperature=0.7)
        response = await llm.ainvoke([HumanMessage(content=req.message)])
        reply = response.content
    except Exception as exc:
        logger.error("LLM error: %s", exc)
        reply = f"Error: Could not get response from model. Is Ollama running? ({exc})"

    # Save assistant message
    await add_message(session_id, "assistant", reply)

    return {
        "session_id": session_id,
        "reply": reply,
        "model": get_active_model(),
    }


# ─── WebSocket ───────────────────────────────────────────────────────────────

@router.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for streaming chat.
    Supports both simple chat and full agent pipeline mode.
    
    Client sends JSON: {"message": "...", "use_agents": bool}
    Server sends JSON events: {"type": "token|agent_step|complete|error", ...}
    """
    await websocket.accept()
    logger.info("WebSocket connected: session=%s", session_id)

    try:
        # Ensure session exists
        session = await get_session(session_id)
        if not session:
            await _ensure_session(session_id)

        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            message = payload.get("message", "").strip()
            use_agents = payload.get("use_agents", False)

            if not message:
                continue

            # Save user message
            await add_message(session_id, "user", message)

            # Auto-title on first message
            session_data = await get_session(session_id)
            if session_data and session_data.get("title") == "New Chat":
                new_title = message[:30] + ("..." if len(message) > 30 else "")
                await update_session_title(session_id, new_title)
                try:
                    await websocket.send_json({"type": "title_updated", "title": new_title})
                except Exception:
                    pass


            if use_agents:
                # Full 7-agent pipeline with streaming progress
                await websocket.send_json({
                    "type": "pipeline_start",
                    "message": "Starting 7-agent pipeline...",
                    "agents": [
                        "supervisor", "problem_discovery", "research",
                        "innovation", "architecture", "ppt", "judge_prep"
                    ],
                })

                run_id = str(uuid.uuid4())
                final_content = ""

                async for event in stream_pipeline(message, session_id=session_id, run_id=run_id):
                    await websocket.send_json(event)
                    if event.get("type") == "complete":
                        final_content = event.get("content", "")

                if final_content:
                    await add_message(session_id, "assistant", final_content, agent_meta={"run_id": run_id})

            else:
                # Simple streaming chat
                llm = await get_llm(temperature=0.7)
                full_response = ""

                await websocket.send_json({"type": "stream_start"})

                async for chunk in llm.astream([HumanMessage(content=message)]):
                    token = chunk.content
                    full_response += token
                    await websocket.send_json({"type": "token", "content": token})

                await websocket.send_json({"type": "stream_end", "model": get_active_model()})

                # Save response
                await add_message(session_id, "assistant", full_response)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: session=%s", session_id)
    except Exception as exc:
        logger.error("WebSocket error: %s", exc)
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
